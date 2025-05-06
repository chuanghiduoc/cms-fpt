import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface PathParams {
  params: Promise<{
    id: string;
  }>;
}

// POST to mark a system announcement as read
export async function POST(request: NextRequest, props: PathParams) {
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

    // Verify that the notification exists
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        readByUsers: {
          where: { id: session.user.id },
          select: { id: true },
        },
      },
    });

    if (!notification) {
      return NextResponse.json(
        { message: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Check if it's a system announcement (no departmentId)
    if (notification.departmentId !== null) {
      return NextResponse.json(
        { message: 'Not a system announcement' },
        { status: 400 }
      );
    }

    // Check if the notification is already marked as read by the user
    if (notification.readByUsers.length > 0) {
      return NextResponse.json({
        message: 'Announcement already marked as read',
      });
    }

    // Mark the notification as read
    await prisma.notification.update({
      where: { id },
      data: {
        readByUsers: {
          connect: {
            id: session.user.id,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Announcement marked as read',
    });
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE to remove the read status for a system announcement
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

    // Verify that the notification exists
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        readByUsers: {
          where: { id: session.user.id },
          select: { id: true },
        },
      },
    });

    if (!notification) {
      return NextResponse.json(
        { message: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Check if it's a system announcement (no departmentId)
    if (notification.departmentId !== null) {
      return NextResponse.json(
        { message: 'Not a system announcement' },
        { status: 400 }
      );
    }

    // Check if the notification is not marked as read by the user
    if (notification.readByUsers.length === 0) {
      return NextResponse.json({
        message: 'Announcement not marked as read',
      });
    }

    // Remove the read status
    await prisma.notification.update({
      where: { id },
      data: {
        readByUsers: {
          disconnect: {
            id: session.user.id,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Read status removed',
    });
  } catch (error) {
    console.error('Error removing read status:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 