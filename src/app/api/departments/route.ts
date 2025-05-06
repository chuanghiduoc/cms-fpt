import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/departments - Lấy danh sách phòng ban
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Lấy danh sách phòng ban kèm số lượng nhân viên
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phòng ban:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xử lý yêu cầu' },
      { status: 500 }
    );
  }
}

// POST /api/departments - Tạo phòng ban mới
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Chỉ admin mới có quyền tạo phòng ban
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Bạn không có quyền thực hiện hành động này' },
        { status: 403 }
      );
    }
    
    const { name, description } = await req.json();
    
    // Validate dữ liệu
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Tên phòng ban không được để trống' },
        { status: 400 }
      );
    }
    
    // Kiểm tra tên phòng ban đã tồn tại chưa
    const existingDepartment = await prisma.department.findUnique({
      where: { name: name.trim() }
    });
    
    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Tên phòng ban đã tồn tại' },
        { status: 400 }
      );
    }
    
    // Tạo phòng ban mới
    const newDepartment = await prisma.department.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null
      }
    });
    
    return NextResponse.json(newDepartment, { status: 201 });
  } catch (error) {
    console.error('Lỗi khi tạo phòng ban:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xử lý yêu cầu' },
      { status: 500 }
    );
  }
} 