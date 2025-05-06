import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check authentication
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only admin can access
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    
    // Get query parameters with defaults
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const searchTerm = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || undefined;
    const type = url.searchParams.get('type') || undefined;
    const sortBy = url.searchParams.get('sortBy') || 'reviewedAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    
    // Calculate offset for pagination
    const skip = (page - 1) * limit;
    
    // Prepare filter for status
    const statusFilter = status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : {};
    
    // Query reviewedBy is not null to get only reviewed content
    const reviewedFilter = { reviewedById: { not: null } };
    
    // Prepare sort options
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[sortBy] = sortOrder as 'asc' | 'desc';
    
    // Type definition for the arrays with necessary properties
    type DocumentWithIncludes = {
      id: string;
      title: string;
      status: string;
      isPublic: boolean;
      createdAt: Date;
      updatedAt: Date;
      reviewedAt: Date | null;
      [key: string]: unknown;
    };
    
    type PostWithIncludes = {
      id: string;
      title: string;
      status: string;
      isPublic: boolean;
      createdAt: Date;
      updatedAt: Date;
      reviewedAt: Date | null;
      [key: string]: unknown;
    };
    
    let documents: DocumentWithIncludes[] = [];
    let posts: PostWithIncludes[] = [];
    let totalDocuments = 0;
    let totalPosts = 0;
    
    // If type is not specified or is 'document', fetch documents
    if (!type || type === 'document') {
      // Build document where clause
      const whereDocuments: Prisma.DocumentWhereInput = {
        ...statusFilter,
        ...reviewedFilter,
      };
      
      // Add search filter if provided
      if (searchTerm) {
        whereDocuments.OR = [
          { title: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
          { filePath: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        ];
      }
      
      documents = await prisma.document.findMany({
        where: whereDocuments,
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          reviewedBy: true,
        },
        orderBy,
        skip: type ? skip : 0,
        take: type ? limit : Math.floor(limit / 2),
      });
      
      totalDocuments = await prisma.document.count({
        where: whereDocuments,
      });
    }
    
    // If type is not specified or is 'post', fetch posts
    if (!type || type === 'post') {
      // Build post where clause
      const wherePosts: Prisma.PostWhereInput = {
        ...statusFilter,
        ...reviewedFilter,
      };
      
      // Add search filter if provided
      if (searchTerm) {
        wherePosts.OR = [
          { title: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
          { content: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        ];
      }
      
      posts = await prisma.post.findMany({
        where: wherePosts,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          reviewedBy: true,
        },
        orderBy,
        skip: type ? skip : 0,
        take: type ? limit : Math.floor(limit / 2),
      });
      
      totalPosts = await prisma.post.count({
        where: wherePosts,
      });
    }
    
    // Format response
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      type: 'document',
      status: doc.status,
      isPublic: doc.isPublic,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      createdBy: doc.uploadedBy,
      reviewedBy: doc.reviewedBy,
      reviewedAt: doc.reviewedAt,
      department: doc.department,
      category: doc.category,
      reviewComments: doc.reviewComments,
    }));
    
    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      type: 'post',
      status: post.status,
      isPublic: post.isPublic,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      createdBy: post.author,
      reviewedBy: post.reviewedBy,
      reviewedAt: post.reviewedAt,
      department: post.department,
      tags: post.tags,
      reviewComments: post.reviewComments,
    }));
    
    // Combine and sort
    let results = [...formattedDocuments, ...formattedPosts];
    
    // Sort combined results
    if (sortBy === 'reviewedAt') {
      results.sort((a, b) => {
        if (!a.reviewedAt) return 1;
        if (!b.reviewedAt) return -1;
        return sortOrder === 'desc'
          ? new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
          : new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime();
      });
    }
    
    // If not querying by type, trim results based on limit
    if (!type) {
      results = results.slice(0, limit);
    }
    
    return NextResponse.json({
      items: results,
      pagination: {
        page,
        limit,
        totalItems: totalDocuments + totalPosts,
        totalPages: Math.ceil((totalDocuments + totalPosts) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching content reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 