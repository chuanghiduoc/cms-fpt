import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface PathParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/events/[id]/participants - Get all participants for an event
export async function GET(request: NextRequest, props: PathParams) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized', success: false },
        { status: 401 }
      );
    }
    
    const { id: eventId } = params;
    
    // Check if event exists and user has access
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true, 
        departmentId: true,
        isPublic: true,
      }
    });
    
    if (!event) {
      return NextResponse.json(
        { message: 'Event not found', success: false },
        { status: 404 }
      );
    }
    
    // Check if user has access to view participants
    const isAdmin = session.user.role === 'ADMIN';
    const isDepartmentHead = session.user.role === 'DEPARTMENT_HEAD';
    const isSameDepartment = event.departmentId === session.user.department;
    
    // Only admin, department head of same department, or participants from the same event can view participants
    const hasAccessToViewAll = isAdmin || (isDepartmentHead && isSameDepartment);
    
    if (!hasAccessToViewAll) {
      // Check if user is a participant
      const isParticipant = await prisma.eventParticipant.findFirst({
        where: {
          eventId,
          userId: session.user.id
        }
      });
      
      if (!isParticipant) {
        return NextResponse.json(
          { message: 'You do not have access to view participants', success: false },
          { status: 403 }
        );
      }
    }
    
    // Get all participants
    const participants = await prisma.eventParticipant.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json({
      participants,
      success: true
    });
    
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/participants - Add or update participation status
export async function POST(request: NextRequest, props: PathParams) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized', success: false },
        { status: 401 }
      );
    }
    
    const { id: eventId } = params;
    const { status, userId } = await request.json();
    
    // Validate status
    if (!['confirmed', 'declined', 'pending'].includes(status.toLowerCase())) {
      return NextResponse.json(
        { message: 'Invalid status', success: false },
        { status: 400 }
      );
    }
    
    // Check if event exists and user has access
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true, 
        departmentId: true,
        isPublic: true,
        createdById: true,
      }
    });
    
    if (!event) {
      return NextResponse.json(
        { message: 'Event not found', success: false },
        { status: 404 }
      );
    }
    
    // Determine if current user can invite others
    const canInviteOthers = 
      session.user.role === 'ADMIN' || 
      session.user.id === event.createdById || 
      (session.user.role === 'DEPARTMENT_HEAD' && event.departmentId === session.user.department);
    
    // If inviting other users, verify permissions
    const targetUserId = userId || session.user.id;
    
    if (targetUserId !== session.user.id && !canInviteOthers) {
      return NextResponse.json(
        { message: 'You do not have permission to invite others to this event', success: false },
        { status: 403 }
      );
    }
    
    // Check if participant record already exists
    const existingParticipant = await prisma.eventParticipant.findFirst({
      where: {
        eventId,
        userId: targetUserId
      }
    });
    
    let participant;
    
    if (existingParticipant) {
      // Update existing participant status
      participant = await prisma.eventParticipant.update({
        where: { id: existingParticipant.id },
        data: { status: status.toLowerCase() }
      });
    } else {
      // Create new participant record
      participant = await prisma.eventParticipant.create({
        data: {
          eventId,
          userId: targetUserId,
          status: status.toLowerCase()
        }
      });
    }
    
    return NextResponse.json({
      message: `Participation status updated to ${status.toLowerCase()}`,
      participant,
      success: true
    });
    
  } catch (error) {
    console.error('Error updating participation status:', error);
    return NextResponse.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
} 