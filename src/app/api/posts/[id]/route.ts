import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ContentStatus, Prisma } from '@prisma/client';

// GET /api/posts/[id] - Get a single post by ID
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
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
        },
        reviewComments: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user has access to this post
    const isAuthor = post.authorId === session.user.id;
    const isDepartmentHead = session.user.role === 'DEPARTMENT_HEAD' && 
                            post.departmentId === session.user.department;
    const isAdmin = session.user.role === 'ADMIN';
    const isPublic = post.isPublic && post.status === ContentStatus.APPROVED;

    if (!isPublic && !isAuthor && !isDepartmentHead && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[id] - Update a post
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
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

    // Check permissions: only author, department head, or admin can update
    const isAuthor = post.authorId === session.user.id;
    const isDepartmentHead = session.user.role === 'DEPARTMENT_HEAD' && 
                            post.departmentId === session.user.department;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isAuthor && !isDepartmentHead && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { title, content, isPublic, tags, coverImageUrl, status, reviewComment } = await request.json();

    // Determine if this is a review action
    const isReview = status && status !== post.status;
    const updatedData: Prisma.PostUpdateInput = {
      updatedAt: new Date()
    };

    // Update basic fields if provided
    if (title !== undefined) updatedData.title = title;
    if (content !== undefined) updatedData.content = content;
    if (isPublic !== undefined) updatedData.isPublic = isPublic;
    if (tags !== undefined) updatedData.tags = tags;
    if (coverImageUrl !== undefined) updatedData.coverImageUrl = coverImageUrl;

    // Handle status change (review)
    if (isReview) {
      // Only department head or admin can review
      if (!isDepartmentHead && !isAdmin) {
        return NextResponse.json(
          { error: 'Only department heads or admins can review posts' },
          { status: 403 }
        );
      }

      updatedData.status = status as ContentStatus;
      updatedData.reviewedBy = { connect: { id: session.user.id } };
      updatedData.reviewedAt = new Date();
    }

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id: params.id },
      data: updatedData
    });

    // Add review comment if provided
    if (isReview && reviewComment) {
      await prisma.reviewComment.create({
        data: {
          content: reviewComment,
          userId: session.user.id,
          postId: params.id
        }
      });
    }

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
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

    // Check permissions: only author, department head, or admin can delete
    const isAuthor = post.authorId === session.user.id;
    const isDepartmentHead = session.user.role === 'DEPARTMENT_HEAD' && 
                            post.departmentId === session.user.department;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isAuthor && !isDepartmentHead && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete post
    await prisma.post.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: 'Post deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
} 