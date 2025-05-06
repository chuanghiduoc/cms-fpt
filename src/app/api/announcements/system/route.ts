import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET handler for system announcements
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

    // Only admins can access system announcements management
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Access denied: Requires administrator privileges' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'createdAt:desc';
    
    // Skip for pagination
    const skip = (page - 1) * limit;
    
    // Sort parameters
    const [sortField, sortOrder] = sort.split(':');
    
    // Build where clause for filtering
    const where = {
      departmentId: null, // System announcements don't belong to a specific department
      title: {
        contains: search,
        mode: 'insensitive' as const,
      },
    };

    // Get total count for pagination
    const total = await prisma.notification.count({ where });
    
    // Fetch announcements with pagination, sorting, and filters
    const announcements = await prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortField]: sortOrder === 'asc' ? 'asc' : 'desc',
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        readByUsers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      announcements,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching system announcements:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler to create a new system announcement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can create system announcements
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Access denied: Requires administrator privileges' },
        { status: 403 }
      );
    }

    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.content) {
      return NextResponse.json(
        { message: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Create the system announcement
    const announcement = await prisma.notification.create({
      data: {
        title: data.title,
        content: data.content,
        isPublic: data.isPublic || false,
        departmentId: null, // System announcements don't belong to a specific department
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      { announcement, message: 'System announcement created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating system announcement:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 