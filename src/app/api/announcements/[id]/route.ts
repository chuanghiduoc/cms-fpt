import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/announcements/[id] - Get a single announcement by ID
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const id = params.id;
    
    // Get announcement with relations
    const announcement = await prisma.notification.findUnique({
      where: { id },
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
      }
    });
    
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }
    
    // Check access permissions
    if (
      !announcement.isPublic &&
      session.user.role !== 'ADMIN' &&
      announcement.departmentId !== session.user.department
    ) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    // Không tự động đánh dấu đã đọc khi xem chi tiết
    // Để người dùng chủ động đánh dấu đã đọc bằng nút đánh dấu đã đọc
    
    return NextResponse.json({
      announcement,
      success: true
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/announcements/[id] - Update an announcement
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const id = params.id;
    const data = await request.json();
    
    // Fetch the announcement to check permissions
    const announcement = await prisma.notification.findUnique({
      where: { id },
      select: {
        createdById: true,
        departmentId: true
      }
    });
    
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }
    
    // Check if user has permission to update
    const canUpdate =
      session.user.role === 'ADMIN' ||
      (session.user.role === 'DEPARTMENT_HEAD' && 
       session.user.department && session.user.department === announcement.departmentId) ||
      session.user.id === announcement.createdById;
    
    if (!canUpdate) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    // Update the announcement
    const updatedAnnouncement = await prisma.notification.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        isPublic: data.isPublic !== undefined ? data.isPublic : undefined,
        departmentId: data.departmentId || undefined,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json(updatedAnnouncement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/announcements/[id] - Delete an announcement
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const id = params.id;
    
    // Fetch the announcement to check permissions
    const announcement = await prisma.notification.findUnique({
      where: { id },
      select: {
        createdById: true,
        departmentId: true
      }
    });
    
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }
    
    // Check if user has permission to delete
    const canDelete =
      session.user.role === 'ADMIN' ||
      (session.user.role === 'DEPARTMENT_HEAD' && 
       session.user.department && session.user.department === announcement.departmentId) ||
      session.user.id === announcement.createdById;
    
    if (!canDelete) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    // Delete the announcement
    await prisma.notification.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 