import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const visibility = searchParams.get('visibility') || undefined;
    const department = searchParams.get('department') || undefined;
    const pageParam = searchParams.get('page') || '1';
    const limitParam = searchParams.get('limit') || '10';
    
    const page = parseInt(pageParam, 10);
    const limit = parseInt(limitParam, 10);
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where: Record<string, unknown> = {};
    
    // Search by title
    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    // Filter by category
    if (category && category !== 'ALL') {
      where.category = category;
    }
    
    // Filter by approval status if provided
    if (status) {
      where.status = status;
    }
    
    // Filter by visibility (public/private)
    if (visibility) {
      if (visibility === 'PUBLIC') {
        where.isPublic = true;
      } else if (visibility === 'PRIVATE') {
        where.isPublic = false;
      }
    }
    
    // Filter by department if provided
    if (department) {
      where.departmentId = department;
    }
    
    // Different access rules based on user role
    if (session.user.role === 'ADMIN') {
      // Admin can see all documents
    } else if (session.user.role === 'DEPARTMENT_HEAD') {
      // Department head can see:
      // Only documents from their own department (public/private, pending/approved/rejected)
      where.departmentId = session.user.department;
    } else {
      // Regular employees can only see public documents or documents from their department
      where.OR = [
        { 
          departmentId: session.user.department,
          isPublic: true
        },
        { isPublic: true }
      ];
    }
    
    // Get total count for pagination
    const total = await prisma.document.count({ where });
    
    // Fetch documents with pagination
    const documents = await prisma.document.findMany({
      where,
      include: {
        uploadedBy: {
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });
    
    return NextResponse.json({
      documents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin or department head
    if (session.user.role !== 'ADMIN' && session.user.role !== 'DEPARTMENT_HEAD') {
      return NextResponse.json(
        { error: 'Only ADMIN or DEPARTMENT_HEAD can upload documents' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    const isPublic = data.isPublic || false;
    
    // If document is private, it's automatically approved
    // If document is public, it needs admin approval (PENDING)
    const status = isPublic ? 'PENDING' : 'APPROVED';
    
    const newDocument = await prisma.document.create({
      data: {
        title: data.title,
        description: data.description || null,
        category: data.category || 'OTHER',
        filePath: data.filePath,
        uploadedById: session.user.id,
        departmentId: data.departmentId || session.user.department,
        isPublic: isPublic,
        status: status
      }
    });
    
    return NextResponse.json(newDocument, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 