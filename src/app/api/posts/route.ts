import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ContentStatus } from '@prisma/client';

// GET /api/posts - Fetch all posts or filtered by department
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const departmentId = searchParams.get('departmentId') || session.user.department || '';
    const publicStatusFilter = searchParams.get('isPublic');
    const contentStatusFilter = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;


    // Query conditions
    const where: {
      departmentId?: string;
      isPublic?: boolean;
      status?: ContentStatus;
      OR?: Array<{title: {contains: string, mode: 'insensitive'}} | {content: {contains: string, mode: 'insensitive'}}>;
    } = {};
    
    // Filter by department
    if (departmentId) {
      where.departmentId = departmentId;
    }

    // Filter by search term
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // Apply public status filter if provided
    if (publicStatusFilter !== null && publicStatusFilter !== '') {
      where.isPublic = publicStatusFilter === 'true';
    } 
    // Add filter for public posts if not department head and no status filter provided
    else if (session.user.role !== 'DEPARTMENT_HEAD' && session.user.role !== 'ADMIN') {
      where.isPublic = true;
    }
    
    // Apply content status filter if provided
    if (contentStatusFilter !== null && contentStatusFilter !== '') {
      where.status = contentStatusFilter as ContentStatus;
    }

    // Get total count for pagination
    const totalItems = await prisma.post.count({ where });

    // Fetch posts with pagination
    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
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
        reviewedBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit
    });

    return NextResponse.json({
      posts,
      pagination: {
        total: totalItems,
        page,
        limit,
        pages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only department heads can create posts
    if (session.user.role !== 'DEPARTMENT_HEAD' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only department heads can create posts' },
        { status: 403 }
      );
    }

    const { title, content, isPublic, tags, coverImageUrl, status: clientStatus, isDraft } = await request.json();

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Sử dụng trạng thái từ client nếu có, nếu không thì sử dụng logic cũ
    let status: ContentStatus;
    
    if (isDraft) {
      // Nếu bài viết là bản nháp, vẫn cần chọn 1 trong các trạng thái hiện có
      // Do không có trạng thái DRAFT, nên ta đặt là PENDING
      status = ContentStatus.PENDING;
    } else if (clientStatus) {
      status = clientStatus as ContentStatus;
    } else if (session.user.role === 'ADMIN') {
      status = ContentStatus.APPROVED; // Admin-created posts are auto-approved
    } else {
      status = ContentStatus.PENDING; // Default to pending for non-admin users
    }

    // Create new post
    const post = await prisma.post.create({
      data: {
        title,
        content,
        isPublic: isPublic ?? false,
        status,
        coverImageUrl,
        tags: tags || [],
        author: {
          connect: { id: session.user.id }
        },
        department: {
          connect: { id: session.user.department || undefined }
        },
        // If admin is creating post, set them as reviewer too
        ...(session.user.role === 'ADMIN' ? {
          reviewedBy: {
            connect: { id: session.user.id }
          },
          reviewedAt: new Date()
        } : {})
      }
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
} 