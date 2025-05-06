import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserUpdateInput } from '@/types/user';

// GET /api/users/[id] - Lấy thông tin một người dùng
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    
    // Kiểm tra xác thực và quyền hạn
    if (!session) {
      return NextResponse.json({ error: 'Không được phép truy cập' }, { status: 401 });
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Không đủ quyền hạn' }, { status: 403 });
    }
    
    const userId = params.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
    
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin người dùng:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// PATCH /api/users/[id] - Cập nhật thông tin người dùng
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    
    // Kiểm tra xác thực và quyền hạn
    if (!session) {
      return NextResponse.json({ error: 'Không được phép truy cập' }, { status: 401 });
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Không đủ quyền hạn' }, { status: 403 });
    }
    
    const userId = params.id;
    const { name, email, password, role, department } = await req.json();
    
    // Kiểm tra người dùng tồn tại
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
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
    
    if (!existingUser) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
    }
    
    // Kiểm tra email đã tồn tại chưa (nếu thay đổi email)
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      
      if (emailExists) {
        return NextResponse.json({ error: 'Email đã được sử dụng' }, { status: 400 });
      }
    }
    
    // Chuẩn bị dữ liệu cập nhật
    const updateData: UserUpdateInput = {
      name,
      email,
      role,
      departmentId: department,
    };
    
    // Chỉ cập nhật mật khẩu nếu có thay đổi
    if (password) {
      updateData.password = await hash(password, 10);
    }
    
    // Cập nhật người dùng
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Lỗi khi cập nhật người dùng:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Xóa người dùng
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    
    // Kiểm tra xác thực và quyền hạn
    if (!session) {
      return NextResponse.json({ error: 'Không được phép truy cập' }, { status: 401 });
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Không đủ quyền hạn' }, { status: 403 });
    }
    
    const userId = params.id;
    
    // Ngăn chặn việc tự xóa tài khoản đang đăng nhập
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Không thể xóa tài khoản đang đăng nhập' },
        { status: 400 }
      );
    }
    
    // Kiểm tra người dùng tồn tại
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!existingUser) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
    }
    
    // Xóa người dùng
    await prisma.user.delete({
      where: { id: userId },
    });
    
    return NextResponse.json({ message: 'Xóa người dùng thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa người dùng:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
} 