import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/departments/[id]/users - Get users in a department
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id }
    });
    
    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    
    // Check access rights (only admins and department heads of this department can see all users)
    const isAdmin = session.user.role === 'ADMIN';
    const isDepartmentHead = session.user.role === 'DEPARTMENT_HEAD' && session.user.department === id;
    
    if (!isAdmin && !isDepartmentHead) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get users of the department
    const users = await prisma.user.findMany({
      where: { departmentId: id },
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
      },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching department users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 