import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ContentStatus, Prisma, Document, Post } from '@prisma/client';

// Define types with includes for better typing
type DocumentWithIncludes = Document & {
  uploadedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: {
      id: string;
      name: string;
    } | null;
  };
  department?: {
    id: string;
    name: string;
  } | null;
  reviewedBy?: {
    id: string;
    name: string;
  } | null;
  reviewComments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      name: string;
      role: string;
    };
  }>;
};

type PostWithIncludes = Post & {
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: {
      id: string;
      name: string;
    } | null;
  };
  department?: {
    id: string;
    name: string;
  } | null;
  reviewedBy?: {
    id: string;
    name: string;
  } | null;
  reviewComments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      name: string;
      role: string;
    };
  }>;
};

// GET /api/admin/content/pending - Get all content items (posts, documents) that need moderation
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

    // Build document filter
    const documentWhere: Prisma.DocumentWhereInput = {};
    
    if (searchTerm) {
      documentWhere.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    
    if (statusFilter && statusFilter !== 'all') {
      // Convert status filter to match the enum in the database
      documentWhere.status = statusFilter.toUpperCase() as ContentStatus;
    } else {
      // Default to showing pending content when no status filter is applied
      documentWhere.status = ContentStatus.PENDING;
    }

    // Build post filter
    const postWhere: Prisma.PostWhereInput = {};
    
    if (searchTerm) {
      postWhere.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
        // Use Prisma's array operators correctly
        { tags: { has: searchTerm } },
      ];
    }
    
    if (statusFilter && statusFilter !== 'all') {
      // Convert status filter to match the enum in the database
      postWhere.status = statusFilter.toUpperCase() as ContentStatus;
    } else {
      // Default to showing pending content when no status filter is applied
      postWhere.status = ContentStatus.PENDING;
    }

    console.log("Document filter:", documentWhere);
    console.log("Post filter:", postWhere);

    // Fetch data based on type filter
    let documents: DocumentWithIncludes[] = [];
    let posts: PostWithIncludes[] = [];
    let documentCount = 0;
    let postCount = 0;

    // Fetch documents if needed
    if (!typeFilter || typeFilter === 'all' || typeFilter === 'document') {
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
        skip: typeFilter === 'all' ? 0 : skip,
        take: typeFilter === 'all' ? Math.ceil(limit / 2) : limit
      }) as unknown as DocumentWithIncludes[];
    }

    // Fetch posts if needed
    if (!typeFilter || typeFilter === 'all' || typeFilter === 'post') {
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
        skip: typeFilter === 'all' ? 0 : skip,
        take: typeFilter === 'all' ? Math.floor(limit / 2) : limit
      }) as unknown as PostWithIncludes[];
    }

    // Format documents into content items
    const documentItems = documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      excerpt: doc.description || '',
      type: 'document',
      status: doc.status.toLowerCase(),
      submittedBy: {
        id: doc.uploadedBy.id,
        name: doc.uploadedBy.name,
        department: doc.uploadedBy.department?.name || 'N/A',
        image: null
      },
      submittedAt: doc.createdAt,
      tags: []
    }));

    // Format posts into content items
    const postItems = posts.map(post => ({
      id: post.id,
      title: post.title,
      excerpt: post.content.substring(0, 150) + (post.content.length > 150 ? '...' : ''),
      type: 'post',
      status: post.status.toLowerCase(),
      submittedBy: {
        id: post.author.id,
        name: post.author.name,
        department: post.author.department?.name || 'N/A',
        image: null
      },
      submittedAt: post.createdAt,
      tags: post.tags || []
    }));

    // Combine all content items
    let contentItems;
    
    if (typeFilter === 'document') {
      contentItems = documentItems;
    } else if (typeFilter === 'post') {
      contentItems = postItems;
    } else {
      // Combine and sort by submittedAt if no specific type filter
      contentItems = [...documentItems, ...postItems].sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      
      // Apply pagination to combined results if needed
      if (contentItems.length > limit && typeFilter === 'all') {
        contentItems = contentItems.slice(0, limit);
      }
    }

    // Calculate total items
    const totalItems = typeFilter === 'document' 
      ? documentCount 
      : typeFilter === 'post' 
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
    console.error('Error fetching pending content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content items' },
      { status: 500 }
    );
  }
} 