import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ContentStatus, Prisma } from '@prisma/client';

// GET /api/admin/content/moderate - Get all content items (posts, documents) that have isPublic set to true
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is admin
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || '';
    const typeFilter = searchParams.get('type') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    console.log("Query parameters:", { 
      searchTerm, 
      statusFilter, 
      typeFilter, 
      page, 
      limit, 
      skip 
    });

    // Build document filter for public content - don't filter by isPublic by default
    const documentWhere: Prisma.DocumentWhereInput = {};
    
    if (searchTerm) {
      documentWhere.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    
    if (statusFilter && statusFilter !== 'ALL' && statusFilter !== 'all') {
      // Convert status filter to match the enum in the database
      documentWhere.status = statusFilter.toUpperCase() as ContentStatus;
    }

    // Build post filter for public content - don't filter by isPublic by default
    const postWhere: Prisma.PostWhereInput = {};
    
    if (searchTerm) {
      postWhere.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { has: searchTerm } },
      ];
    }
    
    if (statusFilter && statusFilter !== 'ALL' && statusFilter !== 'all') {
      // Convert status filter to match the enum in the database
      postWhere.status = statusFilter.toUpperCase() as ContentStatus;
    }

    console.log("Document filter:", documentWhere);
    console.log("Post filter:", postWhere);

    // Fetch data based on type filter
    type SimpleUser = {
      id: string;
      name: string;
      email?: string;
      role?: string;
    };

    type ReviewCommentWithUser = {
      id: string;
      content: string;
      createdAt: Date;
      user: SimpleUser;
    };

    // Define simpler types that match the actual data returned by the database
    type DocumentWithRelations = {
      id: string;
      title: string;
      description: string | null;
      category: string;
      filePath: string;
      status: string;
      isPublic: boolean;
      reviewedById: string | null;
      reviewedAt: Date | null;
      reviewedBy: SimpleUser | null;
      uploadedBy: SimpleUser & {
        department?: { id: string; name: string } | null;
      };
      department: { id: string; name: string } | null;
      createdAt: Date;
      updatedAt: Date;
      reviewComments: ReviewCommentWithUser[];
    };
    
    type PostWithRelations = {
      id: string;
      title: string;
      content: string;
      status: string;
      isPublic: boolean;
      reviewedById: string | null;
      reviewedAt: Date | null;
      reviewedBy: SimpleUser | null;
      author: SimpleUser & {
        department?: { id: string; name: string } | null;
      };
      department: { id: string; name: string } | null;
      tags: string[];
      coverImageUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
      reviewComments: ReviewCommentWithUser[];
    };
    
    let documents: DocumentWithRelations[] = [];
    let posts: PostWithRelations[] = [];
    let documentCount = 0;
    let postCount = 0;

    // Fetch documents if needed
    if (!typeFilter || typeFilter.toUpperCase() === 'ALL' || typeFilter.toUpperCase() === 'DOCUMENT') {
      documentCount = await prisma.document.count({ where: documentWhere });
      console.log(`Found ${documentCount} documents matching filter`);
      
      documents = await prisma.document.findMany({
        where: documentWhere,
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
                  name: true,
                  role: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip: typeFilter === 'ALL' || typeFilter === 'all' ? 0 : skip,
        take: typeFilter === 'ALL' || typeFilter === 'all' ? Math.ceil(limit / 2) : limit
      });
    }

    // Fetch posts if needed
    if (!typeFilter || typeFilter.toUpperCase() === 'ALL' || typeFilter.toUpperCase() === 'POST') {
      postCount = await prisma.post.count({ where: postWhere });
      console.log(`Found ${postCount} posts matching filter`);
      
      posts = await prisma.post.findMany({
        where: postWhere,
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
                  name: true,
                  role: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip: typeFilter === 'ALL' || typeFilter === 'all' ? 0 : skip,
        take: typeFilter === 'ALL' || typeFilter === 'all' ? Math.floor(limit / 2) : limit
      });
    }

    // Format documents into content items
    const documentItems = documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      description: doc.description || '',
      type: 'document',
      category: doc.category,
      filePath: doc.filePath,
      status: doc.status,
      isPublic: doc.isPublic,
      createdBy: {
        id: doc.uploadedBy.id,
        name: doc.uploadedBy.name,
        role: doc.uploadedBy.role,
        department: doc.uploadedBy.department?.name || 'N/A'
      },
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      reviewedAt: doc.reviewedAt || null,
      reviewedBy: doc.reviewedById ? {
        id: doc.reviewedById,
        name: doc.reviewedBy?.name || 'Unknown'
      } : null,
      comments: doc.reviewComments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          id: comment.user.id,
          name: comment.user.name,
          role: comment.user.role
        }
      }))
    }));

    // Format posts into content items
    const postItems = posts.map(post => ({
      id: post.id,
      title: post.title,
      excerpt: post.content.substring(0, 150) + (post.content.length > 150 ? '...' : ''),
      type: 'post',
      status: post.status,
      isPublic: post.isPublic,
      coverImage: post.coverImageUrl,
      tags: post.tags,
      createdBy: {
        id: post.author.id,
        name: post.author.name,
        role: post.author.role,
        department: post.author.department?.name || 'N/A'
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      reviewedAt: post.reviewedAt || null,
      reviewedBy: post.reviewedById ? {
        id: post.reviewedById,
        name: post.reviewedBy?.name || 'Unknown'
      } : null,
      comments: post.reviewComments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          id: comment.user.id,
          name: comment.user.name,
          role: comment.user.role
        }
      }))
    }));

    // Combine all content items
    let contentItems;
    
    if (typeFilter === 'DOCUMENT') {
      contentItems = documentItems;
    } else if (typeFilter === 'POST') {
      contentItems = postItems;
    } else {
      // Combine and sort by updatedAt if no specific type filter
      contentItems = [...documentItems, ...postItems].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      // Apply pagination to combined results if needed
      if (contentItems.length > limit) {
        contentItems = contentItems.slice(0, limit);
      }
    }

    // Calculate total items
    const totalItems = typeFilter === 'DOCUMENT' 
      ? documentCount 
      : typeFilter === 'POST' 
        ? postCount 
        : documentCount + postCount;

    return NextResponse.json({
      items: contentItems,
      pagination: {
        page,
        limit,
        total: totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching content for moderation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content items' },
      { status: 500 }
    );
  }
}

// POST /api/admin/content/moderate - Moderate content (change status, add review comment)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is admin
    if (!session?.user) {
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

    if (action !== 'approve' && action !== 'reject' && action !== 'delete') {
      return NextResponse.json(
        { error: 'action must be either "approve", "reject", or "delete"' },
        { status: 400 }
      );
    }

    // Handle delete action
    if (action === 'delete') {
      if (contentType === 'document') {
        await prisma.document.delete({
          where: { id: contentId }
        });
      } else { // post
        await prisma.post.delete({
          where: { id: contentId }
        });
      }
      
      return NextResponse.json({
        success: true,
        action: 'delete',
        message: `${contentType === 'document' ? 'Document' : 'Post'} deleted successfully`
      });
    }

    // Determine the new status based on the action
    const status = action === 'approve' ? ContentStatus.APPROVED : ContentStatus.REJECTED;

    // Handle approve/reject for document
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
    }
    
    // Handle approve/reject for post
    else { // post
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
    console.error('Error moderating content:', error);
    return NextResponse.json(
      { error: 'Failed to moderate content' },
      { status: 500 }
    );
  }
} 