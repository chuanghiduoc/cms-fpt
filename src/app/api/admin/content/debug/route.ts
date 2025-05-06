import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/content/debug - Debug endpoint to check database content
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is admin
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get post and document counts by status and isPublic
    const postStats = await prisma.$queryRaw`
      SELECT 
        status, 
        "isPublic", 
        COUNT(*) as count 
      FROM "Post" 
      GROUP BY status, "isPublic"
    `;

    const documentStats = await prisma.$queryRaw`
      SELECT 
        status, 
        "isPublic", 
        COUNT(*) as count 
      FROM "Document" 
      GROUP BY status, "isPublic"
    `;

    // Get the first 5 posts and documents
    const recentPosts = await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        isPublic: true,
        createdAt: true,
        authorId: true,
        author: {
          select: {
            name: true
          }
        }
      }
    });

    const recentDocuments = await prisma.document.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        isPublic: true,
        createdAt: true,
        uploadedById: true,
        uploadedBy: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      postStats,
      documentStats,
      recentPosts,
      recentDocuments
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug info' },
      { status: 500 }
    );
  }
} 