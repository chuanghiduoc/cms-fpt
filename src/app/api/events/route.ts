import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/events - Get all events (with filtering)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const departmentId = searchParams.get('departmentId') || undefined;
    const status = searchParams.get('status') || undefined;
    const timeframe = searchParams.get('timeframe') || undefined;
    const participation = searchParams.get('participation') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Build query filters
    const where: Prisma.EventWhereInput = {};
    
    // Add search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Role-based filtering:
    if (session.user.role === 'DEPARTMENT_HEAD') {
      // Department heads can see their department's events and public events
      where.OR = [
        { departmentId: session.user.department },
        { isPublic: true }
      ];
    } else if (session.user.role === 'EMPLOYEE') {
      // Employees can only see their department's events and public events
      where.OR = [
        { departmentId: session.user.department },
        { isPublic: true }
      ];
    }
    // Admins can see all events (no additional filter)
    
    // Add department filter if provided
    if (departmentId) {
      where.departmentId = departmentId;
    }
    
    // Add status filter (public/private)
    if (status) {
      where.isPublic = status === 'true';
    }
    
    // Add timeframe filter
    if (timeframe) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      switch (timeframe) {
        case 'today':
          // Events happening today
          where.AND = [
            { startDate: { gte: today } },
            { startDate: { lt: tomorrow } }
          ];
          break;
        case 'upcoming':
          // Events happening in the future (including today)
          where.startDate = { gte: today };
          break;
        case 'past':
          // Events that have already happened
          where.endDate = { lt: today };
          break;
      }
    }
    
    // Add participation filter
    if (participation && session.user.id) {
      const participationFilter = {
        some: {
          userId: session.user.id,
          status: participation
        }
      };
      
      // Add the participants filter using AND to combine with existing conditions
      if (where.AND) {
        if (Array.isArray(where.AND)) {
          where.AND.push({ participants: participationFilter });
        } else {
          where.AND = [where.AND, { participants: participationFilter }];
        }
      } else {
        where.AND = [{ participants: participationFilter }];
      }
    }
    
    // Get total count for pagination
    const total = await prisma.event.count({ where });
    
    // Get events with pagination
    const events = await prisma.event.findMany({
      where,
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
      },
      orderBy: { startDate: 'asc' },
      skip,
      take: limit
    });
    
    return NextResponse.json({
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      success: true
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only department heads and admins can create events
    if (session.user.role !== 'DEPARTMENT_HEAD' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const data = await request.json();
    
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
    
    // Create the event
    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description || '',
        location: data.location || '',
        startDate,
        endDate,
        isPublic: data.isPublic ?? false,
        departmentId: session.user.department,
        createdById: session.user.id
      }
    });
    
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 