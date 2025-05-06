import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Define params as a Promise type
type Params = Promise<{ id: string }>;

// GET /api/admin/content/[id] - Get a single content item (post or document) by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is admin
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Await the params to get the ID
    const { id } = await params;
    
    // First try to find it as a post
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        department: true,
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

    if (post) {
      // Format and return post
      return NextResponse.json({
        id: post.id,
        title: post.title,
        content: post.content,
        type: 'post',
        status: post.status.toLowerCase(),
        coverImage: post.coverImageUrl,
        attachments: [], // Posts don't have attachments in this model
        tags: post.tags || [],
        submittedBy: {
          id: post.author.id,
          name: post.author.name,
          role: post.author.role,
          department: post.author.department?.name || post.department?.name || 'N/A',
          image: null // Add image field if available
        },
        submittedAt: post.createdAt,
        views: 0, // Add view count if available
        comments: post.reviewComments.map(comment => ({
          id: comment.id,
          text: comment.content,
          createdAt: comment.createdAt,
          createdBy: {
            id: comment.user.id,
            name: comment.user.name,
            image: null
          }
        }))
      });
    }
    
    // If not found as post, try to find as document
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        department: true,
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

    if (document) {
      // Extract filename from the filePath if available
      const filePathParts = document.filePath.split('/');
      const fileName = filePathParts[filePathParts.length - 1] || 'document.pdf';
      
      // Determine file type from name or default to PDF
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'pdf';
      const fileType = fileExtension === 'pdf' ? 'application/pdf' :
                      fileExtension === 'doc' || fileExtension === 'docx' ? 'application/msword' :
                      fileExtension === 'xls' || fileExtension === 'xlsx' ? 'application/excel' :
                      'application/octet-stream';
      
      // Format and return document
      return NextResponse.json({
        id: document.id,
        title: document.title,
        content: document.description || '', // Use description as content for documents
        type: 'document',
        status: document.status.toLowerCase(),
        coverImage: null, // Documents don't have cover images in this model
        attachments: [
          {
            id: document.id,
            name: fileName,
            url: document.filePath,
            type: fileType,
            size: 0 // Add file size if available
          }
        ],
        tags: [], // Documents don't have tags in this schema
        submittedBy: {
          id: document.uploadedBy.id,
          name: document.uploadedBy.name,
          role: document.uploadedBy.role,
          department: document.uploadedBy.department?.name || document.department?.name || 'N/A',
          image: null // Add image field if available
        },
        submittedAt: document.createdAt,
        views: 0, // Add view count if available
        comments: document.reviewComments.map(comment => ({
          id: comment.id,
          text: comment.content,
          createdAt: comment.createdAt,
          createdBy: {
            id: comment.user.id,
            name: comment.user.name,
            image: null
          }
        }))
      });
    }

    // If not found as post or document
    return NextResponse.json({ error: 'Content not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching content details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content details' },
      { status: 500 }
    );
  }
} 