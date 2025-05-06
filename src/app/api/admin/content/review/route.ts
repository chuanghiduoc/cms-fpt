import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/admin/content/review - Review (approve/reject) content
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is admin
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const { contentId, contentType, action, comment } = data;

    if (!contentId || !contentType || !action) {
      return NextResponse.json(
        { error: 'contentId, contentType, and action are required' },
        { status: 400 }
      );
    }

    if (contentType !== 'document' && contentType !== 'post') {
      return NextResponse.json(
        { error: 'contentType must be either "document" or "post"' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Determine the new status based on the action
    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';

    // Update content based on type
    if (contentType === 'document') {
      // Check if document exists
      const existingDocument = await prisma.document.findUnique({
        where: { id: contentId }
      });

      if (!existingDocument) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      // Update document status
      const updatedDocument = await prisma.document.update({
        where: { id: contentId },
        data: {
          status,
          // If the content is approved, update isPublic based on the current setting
          // If rejected, isPublic should be false regardless
          isPublic: action === 'approve' ? existingDocument.isPublic : false,
          reviewedById: session.user.id,
          reviewedAt: new Date()
        }
      });

      // Add comment if provided
      if (comment) {
        await prisma.reviewComment.create({
          data: {
            content: comment,
            userId: session.user.id,
            documentId: contentId
          }
        });
      }

      return NextResponse.json({
        success: true,
        action,
        document: updatedDocument
      });
    } else {
      // Check if post exists
      const existingPost = await prisma.post.findUnique({
        where: { id: contentId }
      });

      if (!existingPost) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }

      // Update post status
      const updatedPost = await prisma.post.update({
        where: { id: contentId },
        data: {
          status,
          // If the content is approved, update isPublic based on the current setting
          // If rejected, isPublic should be false regardless
          isPublic: action === 'approve' ? existingPost.isPublic : false,
          reviewedById: session.user.id,
          reviewedAt: new Date()
        }
      });

      // Add comment if provided
      if (comment) {
        await prisma.reviewComment.create({
          data: {
            content: comment,
            userId: session.user.id,
            postId: contentId
          }
        });
      }

      return NextResponse.json({
        success: true,
        action,
        post: updatedPost
      });
    }
  } catch (error) {
    console.error('Error reviewing content:', error);
    return NextResponse.json(
      { error: 'Failed to review content' },
      { status: 500 }
    );
  }
} 