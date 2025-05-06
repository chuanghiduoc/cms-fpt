import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Không được phép truy cập' },
        { status: 401 }
      );
    }
    
    const departmentId = params.id;
    
    if (!departmentId) {
      return NextResponse.json(
        { message: 'ID phòng ban không hợp lệ' },
        { status: 400 }
      );
    }
    
    // Get department
    const department = await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
    
    if (!department) {
      return NextResponse.json(
        { message: 'Không tìm thấy phòng ban' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json(
      { message: 'Đã xảy ra lỗi khi lấy thông tin phòng ban' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Chỉ admin mới có quyền cập nhật phòng ban
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Bạn không có quyền thực hiện hành động này' },
        { status: 403 }
      );
    }
    
    const departmentId = params.id;
    const { name, description } = await request.json();
    
    // Validate dữ liệu
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Tên phòng ban không được để trống' },
        { status: 400 }
      );
    }
    
    // Kiểm tra tên phòng ban đã tồn tại chưa (ngoại trừ phòng ban hiện tại)
    const existingDepartment = await prisma.department.findFirst({
      where: {
        name: name.trim(),
        NOT: {
          id: departmentId
        }
      }
    });
    
    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Tên phòng ban đã tồn tại' },
        { status: 400 }
      );
    }
    
    // Cập nhật phòng ban
    const updatedDepartment = await prisma.department.update({
      where: {
        id: departmentId
      },
      data: {
        name: name.trim(),
        description: description ? description.trim() : null
      }
    });
    
    return NextResponse.json(updatedDepartment);
  } catch (error) {
    console.error('Lỗi khi cập nhật phòng ban:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xử lý yêu cầu' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Chỉ admin mới có quyền xóa phòng ban
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Bạn không có quyền thực hiện hành động này' },
        { status: 403 }
      );
    }
    
    const departmentId = params.id;
    
    // Kiểm tra xem phòng ban có nhân viên không
    const departmentWithUsers = await prisma.department.findUnique({
      where: {
        id: departmentId
      },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    
    if (departmentWithUsers && departmentWithUsers._count.users > 0) {
      return NextResponse.json(
        { error: 'Không thể xóa phòng ban có nhân viên' },
        { status: 400 }
      );
    }
    
    // Xóa phòng ban
    await prisma.department.delete({
      where: {
        id: departmentId
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lỗi khi xóa phòng ban:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xử lý yêu cầu' },
      { status: 500 }
    );
  }
} 