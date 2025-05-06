import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/announcements - Retrieve all announcements with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where: Prisma.NotificationWhereInput = {};
    
    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Status filter (isPublic)
    if (status === 'published') {
      where.isPublic = true;
    } else if (status === 'draft') {
      where.isPublic = false;
    }
    
    // Access control - regular users can only see their department's or public announcements
    if (session.user.role !== 'ADMIN') {
      where.OR = [
        { isPublic: true },
        { departmentId: session.user.department }
      ];
      
      // Department heads can see all announcements from their department
      if (session.user.role === 'DEPARTMENT_HEAD') {
        // No additional filter, they can see everything in their department
      } else {
        // Regular employees might have additional restrictions if needed
      }
    }
    
    // Get total count for pagination
    const total = await prisma.notification.count({ where });
    
    // Fetch announcements with relations
    const announcements = await prisma.notification.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        },
        readByUsers: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });
    
    return NextResponse.json({
      announcements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/announcements - Create a new announcement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admins and department heads can create announcements
    if (session.user.role !== 'ADMIN' && session.user.role !== 'DEPARTMENT_HEAD') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    // Create the announcement
    const announcement = await prisma.notification.create({
      data: {
        title: data.title,
        content: data.content,
        isPublic: data.isPublic || false,
        departmentId: data.departmentId || session.user.department,
        createdById: session.user.id
      }
    });
    
    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 