import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ContentStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admin can approve posts
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const data = await request.json();
    const { postId, isApproved } = data;
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }
    
    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id: postId }
    });
    
    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Update post approval status and related fields
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        isPublic: isApproved,
        status: isApproved ? ContentStatus.APPROVED : ContentStatus.REJECTED,
        reviewedById: session.user.id,
        reviewedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      post: updatedPost
    });
  } catch (error) {
    console.error('Error updating post approval status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 