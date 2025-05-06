import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/events/[id] - Get a specific event
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    const event = await prisma.event.findUnique({
      where: { id },
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
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Check if user has access to this event
    const userDepartmentId = session.user.department;
    const isAdmin = session.user.role === 'ADMIN';
    
    // If not public and not from user's department, deny access
    if (
      !event.isPublic && 
      event.departmentId !== userDepartmentId && 
      !isAdmin
    ) {
      return NextResponse.json({ error: 'Forbidden', success: false }, { status: 403 });
    }
    
    return NextResponse.json({ 
      ...event, 
      success: true 
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/events/[id] - Update an event
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    const data = await request.json();
    
    // Find the event first to check permissions
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    });
    
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Check if user has permission to edit
    const isAdmin = session.user.role === 'ADMIN';
    const isDepartmentHead = session.user.role === 'DEPARTMENT_HEAD';
    const isSameDepartment = existingEvent.departmentId === session.user.department;
    
    if (!isAdmin && !(isDepartmentHead && isSameDepartment)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Validate required fields
    if (!data.title || !data.startDate || !data.endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate end date is after start date
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    
    if (endDate <= startDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }
    
    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        startDate,
        endDate,
        isPublic: data.isPublic
      }
    });
    
    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/events/[id] - Delete an event
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    // Find the event first to check permissions
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    });
    
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Check if user has permission to delete
    const isAdmin = session.user.role === 'ADMIN';
    const isDepartmentHead = session.user.role === 'DEPARTMENT_HEAD';
    const isSameDepartment = existingEvent.departmentId === session.user.department;
    
    if (!isAdmin && !(isDepartmentHead && isSameDepartment)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Delete the event
    await prisma.event.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 