import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ContentStatus } from '@prisma/client';

// POST /api/posts/[id]/review - Add a review to a post
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only department heads or admins can review posts
    if (session.user.role !== 'DEPARTMENT_HEAD' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only department heads or admins can review posts' },
        { status: 403 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        department: true
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Department heads can only review posts from their department
    if (
      session.user.role === 'DEPARTMENT_HEAD' && 
      post.departmentId !== session.user.department
    ) {
      return NextResponse.json(
        { error: 'You can only review posts from your department' },
        { status: 403 }
      );
    }

    const { status, comment } = await request.json();

    // Validate status
    if (!status || !Object.values(ContentStatus).includes(status as ContentStatus)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be PENDING, APPROVED, or REJECTED' },
        { status: 400 }
      );
    }

    // Update post with review
    const updatedPost = await prisma.post.update({
      where: { id: params.id },
      data: {
        status: status as ContentStatus,
        reviewedBy: {
          connect: { id: session.user.id }
        },
        reviewedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Add review comment if provided
    if (comment) {
      await prisma.reviewComment.create({
        data: {
          content: comment,
          userId: session.user.id,
          postId: params.id
        }
      });
    }

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error reviewing post:', error);
    return NextResponse.json(
      { error: 'Failed to review post' },
      { status: 500 }
    );
  }
}

// GET /api/posts/[id]/review - Get review comments for a post
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user has access to view reviews
    const isAuthor = post.authorId === session.user.id;
    const isDepartmentHead = session.user.role === 'DEPARTMENT_HEAD' && 
                            post.departmentId === session.user.department;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isAuthor && !isDepartmentHead && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get review comments
    const reviewComments = await prisma.reviewComment.findMany({
      where: { postId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(reviewComments);
  } catch (error) {
    console.error('Error fetching review comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review comments' },
      { status: 500 }
    );
  }
} 