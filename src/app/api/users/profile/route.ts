import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Không được phép truy cập' },
        { status: 401 }
      );
    }
    
    const { name } = await req.json();
    
    // Validate input
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { message: 'Họ và tên không được để trống' },
        { status: 400 }
      );
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name,
      },
    });
    
    return NextResponse.json({
      message: 'Cập nhật thông tin thành công',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { message: 'Đã xảy ra lỗi khi cập nhật thông tin cá nhân' },
      { status: 500 }
    );
  }
} 