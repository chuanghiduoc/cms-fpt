import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET public system announcements for all users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const includeRead = searchParams.get('includeRead') === 'true';
    
    // Skip for pagination
    const skip = (page - 1) * limit;
    
    // Build the where clause for filtering
    const where: {
      departmentId: null;
      isPublic: boolean;
      NOT?: {
        readByUsers: {
          some: {
            id: string;
          };
        };
      };
    } = {
      departmentId: null, // System announcements don't belong to a specific department
      isPublic: true, // Only public announcements
    };

    // If we should exclude announcements already read by the user
    if (!includeRead) {
      where.NOT = {
        readByUsers: {
          some: {
            id: session.user.id,
          },
        },
      };
    }

    // Get total count for pagination
    const total = await prisma.notification.count({ where });
    
    // Fetch announcements with pagination
    const announcements = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc', // Most recent first
      },
      skip,
      take: limit,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        readByUsers: {
          where: {
            id: session.user.id,
          },
          select: {
            id: true,
          },
        },
      },
    });

    // Process announcements to include a 'read' flag for the current user
    const processedAnnouncements = announcements.map(announcement => ({
      ...announcement,
      isRead: announcement.readByUsers.length > 0,
      readByUsers: undefined, // Don't expose all readers
    }));

    return NextResponse.json({
      announcements: processedAnnouncements,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching public system announcements:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 