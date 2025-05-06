import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const documentId = params.id;
    
    const document = await prisma.document.findUnique({
      where: { id: documentId },
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
      }
    });
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    // Check access permissions
    const userRole = session.user.role;
    const userDepartment = session.user.department;
    
    if (userRole === 'ADMIN') {
      // Admin can access any document
    } else if (userRole === 'DEPARTMENT_HEAD') {
      // Department head can access their department documents or public documents
      if (!document.isPublic && document.department?.id !== userDepartment) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      // Regular employee can only access public documents
      if (!document.isPublic) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    
    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admin and department head can update documents
    if (session.user.role !== 'ADMIN' && session.user.role !== 'DEPARTMENT_HEAD') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const documentId = params.id;
    const data = await request.json();
    
    // Check if document exists
    const existingDocument = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        department: true
      }
    });
    
    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    // Check if user has permission to update the document
    if (session.user.role !== 'ADMIN') {
      // Department heads can only update documents from their department
      if (existingDocument.department?.id !== session.user.department) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    
    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        isPublic: data.isPublic,
        departmentId: data.departmentId
      }
    });
    
    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const documentId = params.id;
    
    // Check if document exists
    const existingDocument = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        department: true
      }
    });
    
    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    // Check permissions
    if (session.user.role === 'ADMIN') {
      // Admin can delete any document
    } else if (session.user.role === 'DEPARTMENT_HEAD') {
      // Department head can only delete documents from their department
      if (existingDocument.department?.id !== session.user.department) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      // Regular employees cannot delete documents
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Delete document
    await prisma.document.delete({
      where: { id: documentId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 