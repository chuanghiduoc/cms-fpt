import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma, Document, Post, ReviewComment, User } from '@prisma/client';

// GET /api/admin/content - Fetch content items for review
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is admin
    if (!session || !session.user) {
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

    // Process document query filters
    const documentWhere: Prisma.DocumentWhereInput = {};
    
    if (searchTerm) {
      documentWhere.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    
    if (statusFilter && statusFilter !== 'ALL') {
      documentWhere.status = statusFilter as Prisma.EnumContentStatusFilter;
    }

    // Process post query filters
    const postWhere: Prisma.PostWhereInput = {};
    
    if (searchTerm) {
      postWhere.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    
    if (statusFilter && statusFilter !== 'ALL') {
      postWhere.status = statusFilter as Prisma.EnumContentStatusFilter;
    }

    // Fetch documents based on type filter
    type DocumentWithRelations = Document & {
      uploadedBy: { id: string; name: string; email: string; role: string };
      department: { id: string; name: string } | null;
      reviewedBy?: User | null;
      reviewComments: (ReviewComment & {
        user: { id: string; name: string; role: string };
      })[];
    };
    
    type PostWithRelations = Post & {
      author: { id: string; name: string; email: string; role: string };
      department: { id: string; name: string } | null;
      reviewedBy?: User | null;
      reviewComments: (ReviewComment & {
        user: { id: string; name: string; role: string };
      })[];
    };
    
    let documents: DocumentWithRelations[] = [];
    let posts: PostWithRelations[] = [];
    let documentCount = 0;
    let postCount = 0;

    if (!typeFilter || typeFilter === 'ALL' || typeFilter === 'DOCUMENT') {
      // Count total documents matching the criteria
      documentCount = await prisma.document.count({ where: documentWhere });

      // Fetch documents with pagination if needed
      if (!typeFilter || typeFilter === 'ALL') {
        // If fetching all types, limit the number of documents to half the limit
        documents = await prisma.document.findMany({
          where: documentWhere,
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
          skip: typeFilter === 'ALL' ? skip : 0,
          take: typeFilter === 'ALL' ? Math.ceil(limit / 2) : limit
        });
      } else {
        // If only documents are requested, use the full limit
        documents = await prisma.document.findMany({
          where: documentWhere,
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
          skip,
          take: limit
        });
      }
    }

    // Fetch posts based on type filter
    if (!typeFilter || typeFilter === 'ALL' || typeFilter === 'POST') {
      // Count total posts matching the criteria
      postCount = await prisma.post.count({ where: postWhere });

      // Fetch posts with pagination if needed
      if (!typeFilter || typeFilter === 'ALL') {
        // If fetching all types, limit the number of posts to half the limit
        posts = await prisma.post.findMany({
          where: postWhere,
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
          skip: typeFilter === 'ALL' ? skip : 0,
          take: typeFilter === 'ALL' ? Math.floor(limit / 2) : limit
        });
      } else {
        // If only posts are requested, use the full limit
        posts = await prisma.post.findMany({
          where: postWhere,
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
          skip,
          take: limit
        });
      }
    }

    // Format documents as content items
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
        department: doc.department?.name || 'N/A'
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

    // Format posts as content items
    const postItems = posts.map(post => ({
      id: post.id,
      title: post.title,
      excerpt: post.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
      content: post.content,
      type: 'post',
      status: post.status,
      isPublic: post.isPublic,
      tags: post.tags,
      coverImageUrl: post.coverImageUrl || null,
      createdBy: {
        id: post.author.id,
        name: post.author.name,
        role: post.author.role,
        department: post.department?.name || 'N/A'
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

    // Combine and sort all content items by updatedAt (newest first)
    let contentItems = [...documentItems, ...postItems];
    contentItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Apply pagination if fetching all types
    if (!typeFilter || typeFilter === 'ALL') {
      const startIndex = 0; // We already applied pagination in the queries
      const endIndex = limit;
      contentItems = contentItems.slice(startIndex, endIndex);
    }

    // Calculate total items
    const totalItems = typeFilter === 'DOCUMENT' ? documentCount : 
                      typeFilter === 'POST' ? postCount :
                      documentCount + postCount;

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
    console.error('Error fetching content items for review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content items' },
      { status: 500 }
    );
  }
} 