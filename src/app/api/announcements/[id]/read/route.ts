import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface PathParams {
  params: Promise<{
    id: string;
  }>;
}

// POST to mark an announcement as read
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

    // Verify that the announcement exists
    const announcement = await prisma.notification.findUnique({
      where: { id },
      include: {
        readByUsers: {
          where: { id: session.user.id },
          select: { id: true },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json(
        { message: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Check if the announcement is already marked as read by the user
    if (announcement.readByUsers.length > 0) {
      return NextResponse.json({
        message: 'Announcement already marked as read',
      });
    }

    // Mark the announcement as read
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
      success: true
    });
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    return NextResponse.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

// DELETE to remove the read status for an announcement
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

    // Verify that the announcement exists
    const announcement = await prisma.notification.findUnique({
      where: { id },
      include: {
        readByUsers: {
          where: { id: session.user.id },
          select: { id: true },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json(
        { message: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Check if the announcement is not marked as read by the user
    if (announcement.readByUsers.length === 0) {
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
      success: true
    });
  } catch (error) {
    console.error('Error removing read status:', error);
    return NextResponse.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
} 