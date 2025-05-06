import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/users - Lấy danh sách người dùng
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Kiểm tra xác thực và quyền hạn
    if (!session) {
      return NextResponse.json({ error: 'Không được phép truy cập' }, { status: 401 });
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Không đủ quyền hạn' }, { status: 403 });
    }
    
    // Lấy danh sách người dùng, sắp xếp theo tên
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// POST /api/users - Tạo người dùng mới
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Kiểm tra xác thực và quyền hạn
    if (!session) {
      return NextResponse.json({ error: 'Không được phép truy cập' }, { status: 401 });
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Không đủ quyền hạn' }, { status: 403 });
    }
    
    const { name, email, password, role, department } = await req.json();
    
    // Kiểm tra dữ liệu đầu vào
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }
    
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'Email đã được sử dụng' }, { status: 400 });
    }
    
    // Mã hóa mật khẩu
    const hashedPassword = await hash(password, 10);
    
    // Tạo người dùng mới
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        department,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Lỗi khi tạo người dùng:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
} 