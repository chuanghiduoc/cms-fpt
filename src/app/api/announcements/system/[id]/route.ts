import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface PathParams {
  params: Promise<{
    id: string;
  }>;
}

// GET a specific system announcement
export async function GET(request: NextRequest, props: PathParams) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can view system announcements in the admin interface
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Access denied: Requires administrator privileges' },
        { status: 403 }
      );
    }

    // Fetch the announcement
    const announcement = await prisma.notification.findUnique({
      where: {
        id,
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

    if (!announcement) {
      return NextResponse.json(
        { message: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Make sure it's a system announcement (has no departmentId)
    if (announcement.departmentId !== null) {
      return NextResponse.json(
        { message: 'Not a system announcement' },
        { status: 400 }
      );
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error fetching system announcement:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// UPDATE a system announcement
export async function PUT(request: NextRequest, props: PathParams) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can update system announcements
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Access denied: Requires administrator privileges' },
        { status: 403 }
      );
    }

    // Check if the announcement exists and is a system announcement
    const existingAnnouncement = await prisma.notification.findUnique({
      where: {
        id,
      },
    });

    if (!existingAnnouncement) {
      return NextResponse.json(
        { message: 'Announcement not found' },
        { status: 404 }
      );
    }

    if (existingAnnouncement.departmentId !== null) {
      return NextResponse.json(
        { message: 'Not a system announcement' },
        { status: 400 }
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

    // Update the announcement
    const updatedAnnouncement = await prisma.notification.update({
      where: {
        id,
      },
      data: {
        title: data.title,
        content: data.content,
        isPublic: data.isPublic || false,
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

    return NextResponse.json({
      announcement: updatedAnnouncement,
      message: 'Announcement updated successfully',
    });
  } catch (error) {
    console.error('Error updating system announcement:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE a system announcement
export async function DELETE(request: NextRequest, props: PathParams) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can delete system announcements
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Access denied: Requires administrator privileges' },
        { status: 403 }
      );
    }

    // Check if the announcement exists and is a system announcement
    const existingAnnouncement = await prisma.notification.findUnique({
      where: {
        id,
      },
    });

    if (!existingAnnouncement) {
      return NextResponse.json(
        { message: 'Announcement not found' },
        { status: 404 }
      );
    }

    if (existingAnnouncement.departmentId !== null) {
      return NextResponse.json(
        { message: 'Not a system announcement' },
        { status: 400 }
      );
    }

    // Delete the announcement
    await prisma.notification.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting system announcement:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 