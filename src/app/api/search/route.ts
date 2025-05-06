import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma, Document, Event, Notification } from '@prisma/client';

type DocumentWithRelations = Document & {
  department: { id: string; name: string } | null;
  uploadedBy: { id: string; name: string; email: string };
};

type EventWithRelations = Event & {
  department: { id: string; name: string } | null;
  createdBy: { id: string; name: string; email: string };
};

type NotificationWithRelations = Notification & {
  department: { id: string; name: string } | null;
  createdBy: { id: string; name: string; email: string };
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type') || 'all'; // all, documents, events, announcements
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // If no search query is provided, return empty results
    if (!query.trim()) {
      return NextResponse.json({
        documents: [],
        events: [],
        announcements: [],
        totalResults: 0
      });
    }

    // Determine what content to search based on user role and permissions
    const userDepartmentId = session.user.department;
    const isAdmin = session.user.role === 'ADMIN';

    // Define base filters for each content type
    const documentsWhere: Prisma.DocumentWhereInput = {};
    const eventsWhere: Prisma.EventWhereInput = {};
    const announcementsWhere: Prisma.NotificationWhereInput = {};

    // Add search conditions
    documentsWhere.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } }
    ];
    
    eventsWhere.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { location: { contains: query, mode: 'insensitive' } }
    ];
    
    announcementsWhere.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } }
    ];

    // Apply access filters based on user role
    if (!isAdmin) {
      // For documents: Users can see public documents or documents from their department
      documentsWhere.AND = [
        {
          OR: [
            { isPublic: true },
            { departmentId: userDepartmentId }
          ]
        },
        { status: 'APPROVED' } // Only show approved documents
      ];
      
      // For events: Users can see public events or events from their department
      eventsWhere.OR = [
        { isPublic: true },
        { departmentId: userDepartmentId }
      ];
      
      // For announcements: Users can see public announcements or announcements from their department
      announcementsWhere.OR = [
        { isPublic: true },
        { departmentId: userDepartmentId }
      ];
    } else {
      // Admins can see all content
      documentsWhere.status = 'APPROVED'; // Still only show approved documents
    }

    // Execute searches based on the requested type
    let documents: DocumentWithRelations[] = [];
    let events: EventWithRelations[] = [];
    let announcements: NotificationWithRelations[] = [];
    let totalDocuments = 0;
    let totalEvents = 0;
    let totalAnnouncements = 0;

    if (type === 'all' || type === 'documents') {
      [documents, totalDocuments] = await Promise.all([
        prisma.document.findMany({
          where: documentsWhere,
          orderBy: { createdAt: 'desc' },
          include: {
            department: {
              select: {
                id: true,
                name: true
              }
            },
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          skip: type === 'documents' ? skip : 0,
          take: type === 'documents' ? limit : 5 // Limit to 5 items if showing all types
        }) as Promise<DocumentWithRelations[]>,
        prisma.document.count({ where: documentsWhere })
      ]);
    }

    if (type === 'all' || type === 'events') {
      [events, totalEvents] = await Promise.all([
        prisma.event.findMany({
          where: eventsWhere,
          orderBy: { startDate: 'asc' },
          include: {
            department: {
              select: {
                id: true,
                name: true
              }
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          skip: type === 'events' ? skip : 0,
          take: type === 'events' ? limit : 5 // Limit to 5 items if showing all types
        }) as Promise<EventWithRelations[]>,
        prisma.event.count({ where: eventsWhere })
      ]);
    }

    if (type === 'all' || type === 'announcements') {
      [announcements, totalAnnouncements] = await Promise.all([
        prisma.notification.findMany({
          where: announcementsWhere,
          orderBy: { createdAt: 'desc' },
          include: {
            department: {
              select: {
                id: true,
                name: true
              }
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          skip: type === 'announcements' ? skip : 0,
          take: type === 'announcements' ? limit : 5 // Limit to 5 items if showing all types
        }) as Promise<NotificationWithRelations[]>,
        prisma.notification.count({ where: announcementsWhere })
      ]);
    }

    const totalResults = totalDocuments + totalEvents + totalAnnouncements;

    // Return search results
    return NextResponse.json({
      documents,
      events,
      announcements,
      pagination: {
        total: totalResults,
        totalDocuments,
        totalEvents,
        totalAnnouncements,
        page,
        limit,
        totalPages: Math.ceil(
          (type === 'all' ? totalResults : 
           type === 'documents' ? totalDocuments : 
           type === 'events' ? totalEvents : 
           totalAnnouncements) / limit
        )
      }
    });
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 