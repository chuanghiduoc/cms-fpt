import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admin can approve documents
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const data = await request.json();
    const { documentId, isApproved } = data;
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }
    
    // Check if document exists
    const existingDocument = await prisma.document.findUnique({
      where: { id: documentId }
    });
    
    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    // Update document approval status (isPublic field)
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        isPublic: isApproved,
        status: isApproved ? 'APPROVED' : 'REJECTED',
        reviewedById: session.user.id,
        reviewedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      document: updatedDocument
    });
  } catch (error) {
    console.error('Error approving document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 