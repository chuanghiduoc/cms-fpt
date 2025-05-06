import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuth = !!token
  const role = token?.role as string || ''
  const { pathname } = request.nextUrl

  // Nếu chưa đăng nhập và cố truy cập vào route cần xác thực
  if (!isAuth && (
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/manager') || 
    pathname.startsWith('/employee')
  )) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Chỉ cho phép ADMIN truy cập vào route /admin
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Chỉ cho phép DEPARTMENT_HEAD truy cập vào route /manager
  if (pathname.startsWith('/manager') && role !== 'DEPARTMENT_HEAD') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Đảm bảo chỉ EMPLOYEE và DEPARTMENT_HEAD mới có thể truy cập /employee
  if (pathname.startsWith('/employee') && 
      role !== 'EMPLOYEE' && 
      role !== 'DEPARTMENT_HEAD' && 
      role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Áp dụng middleware cho các route cần kiểm tra
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/manager/:path*',
    '/employee/:path*',
  ],
} 