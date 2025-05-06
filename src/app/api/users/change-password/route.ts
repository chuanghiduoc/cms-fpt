import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Không được phép truy cập' },
        { status: 401 }
      );
    }
    
    const { currentPassword, newPassword } = await req.json();
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới' },
        { status: 400 }
      );
    }
    
    // Get user from database with password
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        password: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'Người dùng không tồn tại' },
        { status: 404 }
      );
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Mật khẩu hiện tại không chính xác' },
        { status: 400 }
      );
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });
    
    return NextResponse.json({
      message: 'Mật khẩu đã được thay đổi thành công',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { message: 'Đã xảy ra lỗi khi thay đổi mật khẩu' },
      { status: 500 }
    );
  }
} 