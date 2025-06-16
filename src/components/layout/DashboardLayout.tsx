'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  FiHome, 
  FiFileText, 
  FiBell, 
  FiCalendar, 
  FiUsers, 
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  // FiLock,
  FiEdit,
  FiChevronDown,
  FiChevronRight,
  FiUser,
  FiCheckSquare
} from 'react-icons/fi';
import { MdOutlineCorporateFare } from 'react-icons/md';
import NotificationDropdown from '@/components/common/NotificationDropdown';

// Helper function to get user initials
const getUserInitials = (name: string | null | undefined) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [departmentMenuOpen, setDepartmentMenuOpen] = useState(true);
  const [adminMenuOpen, setAdminMenuOpen] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const mobileProfileDropdownRef = useRef<HTMLDivElement>(null);
  const desktopProfileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const desktopButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Function to smoothly toggle profile dropdown
  const handleProfileClick = () => {
    // If we're closing, add a slight delay to allow animation to complete
    if (profileDropdownOpen) {
      // First set a closing class that triggers the closing animation
      if (mobileProfileDropdownRef.current) {
        mobileProfileDropdownRef.current.style.animation = 'fadeOut 0.15s ease-out forwards, slideOut 0.15s ease-out forwards';
      }
      if (desktopProfileDropdownRef.current) {
        desktopProfileDropdownRef.current.style.animation = 'fadeOut 0.15s ease-out forwards, slideOut 0.15s ease-out forwards';
      }
      
      // Then set a timeout to actually close it
      setTimeout(() => {
        setProfileDropdownOpen(false);
      }, 150); // Match animation duration
    } else {
      setProfileDropdownOpen(true);
    }
  };

  // Define keyframe animations in a style tag
  useEffect(() => {
    // Create style element if it doesn't exist
    if (!document.getElementById('dropdown-animations')) {
      const style = document.createElement('style');
      style.id = 'dropdown-animations';
      style.innerHTML = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(-10px); }
          to { transform: translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideOut {
          from { transform: translateY(0); }
          to { transform: translateY(-10px); }
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Optional cleanup
      const style = document.getElementById('dropdown-animations');
      if (style) {
        // Only remove if we're unmounting the entire component
      }
    };
  }, []);

  // Add click outside listener for profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Don't close if clicking the button itself (handled by the button click handler)
      if (mobileButtonRef.current?.contains(event.target as Node) || 
          desktopButtonRef.current?.contains(event.target as Node)) {
        return;
      }
      
      // Close if clicking outside both dropdown containers
      if ((mobileProfileDropdownRef.current === null || !mobileProfileDropdownRef.current.contains(event.target as Node)) &&
          (desktopProfileDropdownRef.current === null || !desktopProfileDropdownRef.current.contains(event.target as Node))) {
        
        // Trigger smooth closing animation
        if (mobileProfileDropdownRef.current) {
          mobileProfileDropdownRef.current.style.animation = 'fadeOut 0.15s ease-out forwards, slideOut 0.15s ease-out forwards';
        }
        if (desktopProfileDropdownRef.current) {
          desktopProfileDropdownRef.current.style.animation = 'fadeOut 0.15s ease-out forwards, slideOut 0.15s ease-out forwards';
        }
        
        // Close after animation completes
        setTimeout(() => {
          setProfileDropdownOpen(false);
        }, 150);
      }
    }
    
    // Only add listener if dropdown is open
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // Base navigation visible to all users
  const navigation = [
    { name: 'Trang chủ', href: '/dashboard', icon: FiHome },
    { name: 'Thông báo công ty', href: '/company/announcements', icon: FiBell },
    { name: 'Hoạt động công ty', href: '/company/events', icon: FiCalendar },
    { name: 'Tài liệu công ty', href: '/company/documents', icon: FiFileText },
    { name: 'Tin tức công ty', href: '/company/posts', icon: FiEdit },
  ];

  // Add links based on user role
  if (session?.user?.role === 'ADMIN') {
    // Admin navigation will now use dropdown
  } else if (session?.user?.role === 'DEPARTMENT_HEAD') {
    // We don't need to add common items as they're already in the base navigation
  } else if (session?.user?.role === 'EMPLOYEE'){
    // We don't need to add common items as they're already in the base navigation
  }

  // Admin management submenu for admin
  const adminManagement = [
    { name: 'Quản lý người dùng', href: '/admin/users', icon: FiUsers },
    { name: 'Quản lý phòng ban', href: '/admin/departments', icon: MdOutlineCorporateFare },
    // { name: 'Phân quyền', href: '/admin/permissions', icon: FiLock },
    { name: 'Thông báo hệ thống', href: '/admin/announcements', icon: FiBell },
    { name: 'Quản lý bài viết', href: '/admin/posts', icon: FiEdit },
    { name: 'Kiểm duyệt nội dung', href: '/admin/content-review', icon: FiCheckSquare }
  ];

  // Department management submenu for department heads
  const departmentManagement = [
    { name: 'Quản lý tài liệu', href: '/manager/documents', icon: FiFileText },
    { name: 'Quản lý thông báo', href: '/manager/announcements', icon: FiBell },
    { name: 'Quản lý sự kiện', href: '/manager/events', icon: FiCalendar },
    { name: 'Quản lý bài viết', href: '/manager/posts', icon: FiEdit },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar for mobile */}
      <div
        className={`fixed inset-y-0 left-0 flex flex-col z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="FPT Logo"
                width={40}
                height={40}
                className="h-8 w-auto"
              />
              <span className="ml-2 text-lg font-medium text-gray-900">FPT CMS</span>
            </div>
            <button
              className="rounded-md text-gray-500 hover:text-gray-600 focus:outline-none cursor-pointer"
              onClick={() => setSidebarOpen(false)}
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
                  pathname === item.href
                    ? 'bg-orange-100 text-orange-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
                style={{ cursor: 'pointer' }}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    pathname === item.href ? 'text-orange-500' : 'text-gray-500 group-hover:text-gray-600'
                  }`}
                />
                {item.name}
              </Link>
            ))}

            {/* Admin Management dropdown for mobile - only for admins */}
            {session?.user?.role === 'ADMIN' && (
              <div className="mt-4">
                <button
                  className={`w-full group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
                    pathname.includes('/admin/')
                      ? 'bg-orange-100 text-orange-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  <div className="flex items-center">
                    <FiSettings
                      className={`mr-3 h-5 w-5 ${
                        pathname.includes('/admin/') ? 'text-orange-500' : 'text-gray-500 group-hover:text-gray-600'
                      }`}
                    />
                    <span>Quản lý hệ thống</span>
                  </div>
                  {adminMenuOpen ? (
                    <FiChevronDown className="h-4 w-4" />
                  ) : (
                    <FiChevronRight className="h-4 w-4" />
                  )}
                </button>

                {adminMenuOpen && (
                  <div className="mt-1 space-y-1">
                    {adminManagement.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ml-5 ${
                          pathname === subItem.href
                            ? 'bg-orange-100 text-orange-600'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                        style={{ cursor: 'pointer' }}
                      >
                        <subItem.icon
                          className={`mr-3 h-5 w-5 ${
                            pathname === subItem.href ? 'text-orange-500' : 'text-gray-500 group-hover:text-gray-600'
                          }`}
                        />
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Department Management dropdown for mobile - only for department heads */}
            {session?.user?.role === 'DEPARTMENT_HEAD' && (
              <div className="mt-4">
                <button
                  className={`w-full group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
                    pathname.includes('/manager/')
                      ? 'bg-orange-100 text-orange-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setDepartmentMenuOpen(!departmentMenuOpen)}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  <div className="flex items-center">
                    <MdOutlineCorporateFare
                      className={`mr-3 h-5 w-5 ${
                        pathname.includes('/manager/') ? 'text-orange-500' : 'text-gray-500 group-hover:text-gray-600'
                      }`}
                    />
                    <span>Quản lý phòng ban</span>
                  </div>
                  {departmentMenuOpen ? (
                    <FiChevronDown className="h-4 w-4" />
                  ) : (
                    <FiChevronRight className="h-4 w-4" />
                  )}
                </button>

                {departmentMenuOpen && (
                  <div className="mt-1 space-y-1">
                    {departmentManagement.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ml-5 ${
                          pathname === subItem.href
                            ? 'bg-orange-100 text-orange-600'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                        style={{ cursor: 'pointer' }}
                      >
                        <subItem.icon
                          className={`mr-3 h-5 w-5 ${
                            pathname === subItem.href ? 'text-orange-500' : 'text-gray-500 group-hover:text-gray-600'
                          }`}
                        />
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>
          
          {/* Footer section with extra links and logout button */}
          <div className="mt-4 flex-shrink-0">
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                FPT Software
              </h3>
              <div className="mt-1 space-y-1">
                <a 
                  href="https://www.fpt-software.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center px-2 py-1 text-sm font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50"
                  style={{ cursor: 'pointer' }}
                >
                  <span className="truncate">Trang chủ FPT</span>
                </a>
                <a 
                  href="#" 
                  className="group flex items-center px-2 py-1 text-sm font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50"
                  style={{ cursor: 'pointer' }}
                >
                  <span className="truncate">Trợ giúp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex items-center h-16 px-4 bg-white border-b border-gray-200">
              <Image
                src="/logo.png"
                alt="FPT Logo"
                width={36}
                height={36}
                className="h-8 w-auto"
              />
              <span className="ml-2 text-lg font-medium text-gray-900">FPT CMS</span>
            </div>
            
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      pathname === item.href
                        ? 'bg-orange-100 text-orange-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${
                        pathname === item.href ? 'text-orange-500' : 'text-gray-500 group-hover:text-gray-600'
                      }`}
                    />
                    {item.name}
                  </Link>
                ))}

                {/* Admin Management dropdown for desktop - only for admins */}
                {session?.user?.role === 'ADMIN' && (
                  <div className="mt-4">
                    <button
                      className={`w-full group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md ${
                        pathname.includes('/admin/')
                          ? 'bg-orange-100 text-orange-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                      style={{ cursor: 'pointer', outline: 'none' }}
                    >
                      <div className="flex items-center">
                        <FiSettings
                          className={`mr-3 h-5 w-5 ${
                            pathname.includes('/admin/') ? 'text-orange-500' : 'text-gray-500 group-hover:text-gray-600'
                          }`}
                        />
                        <span>Quản lý hệ thống</span>
                      </div>
                      {adminMenuOpen ? (
                        <FiChevronDown className="h-4 w-4" />
                      ) : (
                        <FiChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {adminMenuOpen && (
                      <div className="mt-1 space-y-1">
                        {adminManagement.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ml-5 ${
                              pathname === subItem.href
                                ? 'bg-orange-100 text-orange-600'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            style={{ cursor: 'pointer' }}
                          >
                            <subItem.icon
                              className={`mr-3 h-5 w-5 ${
                                pathname === subItem.href ? 'text-orange-500' : 'text-gray-500 group-hover:text-gray-600'
                              }`}
                            />
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Department Management dropdown for desktop - only for department heads */}
                {session?.user?.role === 'DEPARTMENT_HEAD' && (
                  <div className="mt-4">
                    <button
                      className={`w-full group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md ${
                        pathname.includes('/manager/')
                          ? 'bg-orange-100 text-orange-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setDepartmentMenuOpen(!departmentMenuOpen)}
                      style={{ cursor: 'pointer', outline: 'none' }}
                    >
                      <div className="flex items-center">
                        <MdOutlineCorporateFare
                          className={`mr-3 h-5 w-5 ${
                            pathname.includes('/manager/') ? 'text-orange-500' : 'text-gray-500 group-hover:text-gray-600'
                          }`}
                        />
                        <span>Quản lý phòng ban</span>
                      </div>
                      {departmentMenuOpen ? (
                        <FiChevronDown className="h-4 w-4" />
                      ) : (
                        <FiChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {departmentMenuOpen && (
                      <div className="mt-1 space-y-1">
                        {departmentManagement.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ml-5 ${
                              pathname === subItem.href
                                ? 'bg-orange-100 text-orange-600'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            style={{ cursor: 'pointer' }}
                          >
                            <subItem.icon
                              className={`mr-3 h-5 w-5 ${
                                pathname === subItem.href ? 'text-orange-500' : 'text-gray-500 group-hover:text-gray-600'
                              }`}
                            />
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </nav>
              
              {/* Footer section with extra links and logout button */}
              <div className="mt-4 flex-shrink-0">
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    FPT Software
                  </h3>
                  <div className="mt-1 space-y-1">
                    <a 
                      href="https://www.fpt-software.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group flex items-center px-2 py-1 text-sm font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50"
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="truncate">Trang chủ FPT</span>
                    </a>
                    <a 
                      href="#" 
                      className="group flex items-center px-2 py-1 text-sm font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50"
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="truncate">Trợ giúp</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile header - update to hide username and role */}
        <div className="md:hidden flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <button
            className="flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500 cursor-pointer"
            onClick={() => setSidebarOpen(true)}
            style={{ cursor: 'pointer', outline: 'none' }}
          >
            <FiMenu className="h-6 w-6 text-gray-500" />
          </button>
          <div className="flex items-center">
            {/* Notification Dropdown */}
            <div className="mr-3">
              <NotificationDropdown limit={5} />
            </div>
            <div className="relative">
              <button 
                ref={mobileButtonRef}
                onClick={handleProfileClick}
                className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white font-medium shadow-md transition duration-150 duration-200 hover:shadow-lg transform hover:scale-105"
                style={{ outline: 'none', cursor: 'pointer' }}
              >
                {getUserInitials(session?.user?.name)}
              </button>
              
              {profileDropdownOpen && (
                <div 
                  ref={mobileProfileDropdownRef} 
                  className="absolute right-0 mt-2 w-64 rounded-lg shadow-md bg-white ring-1 ring-gray-200 z-50 overflow-hidden transition duration-150 duration-200 transform origin-top-right animate-dropdown"
                  style={{
                    animation: 'fadeIn 0.2s ease-out forwards, slideIn 0.2s ease-out forwards'
                  }}
                >
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{session?.user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      className="flex w-full items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 text-left"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        toast.success('Tính năng đang được phát triển!', {
                          icon: '👨‍💻',
                        });
                      }}
                      style={{ cursor: 'pointer', outline: 'none' }}
                    >
                      <FiUser className="mr-3 h-4 w-4 text-gray-500" />
                      Thông tin cá nhân
                    </button>
                    <button
                      className="flex w-full items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 text-left"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        toast.success('Tính năng đang được phát triển!', {
                          icon: '⚙️',
                        });
                      }}
                      style={{ cursor: 'pointer', outline: 'none' }}
                    >
                      <FiSettings className="mr-3 h-4 w-4 text-gray-500" />
                      Cài đặt tài khoản
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        signOut({ callbackUrl: '/login' });
                      }}
                      className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                      style={{ cursor: 'pointer', outline: 'none' }}
                    >
                      <FiLogOut className="mr-3 h-4 w-4 text-red-500" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="mx-auto px-4 sm:px-6 md:px-8">
              {/* Desktop header - hidden on mobile */}
              <div className="pb-4 border-b border-gray-200 flex justify-between items-center hidden md:flex">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {pathname === '/dashboard' && 'Trang chủ'}
                  {pathname.startsWith('/employee/documents') && 'Tài liệu'}
                  {pathname.startsWith('/employee/announcements') && 'Thông báo'}
                  {pathname.startsWith('/employee/events') && 'Sự kiện'}
                  {pathname.startsWith('/manager/announcements') && 'Quản lý thông báo'}
                  {pathname.startsWith('/manager/documents') && 'Quản lý tài liệu'}
                  {pathname.startsWith('/manager/posts') && 'Quản lý bài viết'}
                  {pathname.startsWith('/admin/posts') && 'Quản lý bài viết'}
                  {pathname.startsWith('/manager/events') && 'Quản lý sự kiện'}
                  {pathname.startsWith('/admin/departments') && 'Quản lý phòng ban'}
                  {pathname.startsWith('/admin/users') && 'Quản lý người dùng'}
                  {pathname.startsWith('/admin/permissions') && 'Phân quyền'}
                  {pathname.startsWith('/admin/content-review') && 'Kiểm duyệt nội dung'}
                  {pathname.startsWith('/admin/announcements') && 'Thông báo hệ thống'}
                  {pathname === '/profile' && 'Thông tin cá nhân'}
                  {pathname === '/profile/settings' && 'Cài đặt tài khoản'}
                  {pathname.startsWith('/company/announcements') && 'Thông báo công ty'}
                  {pathname.startsWith('/company/events') && 'Hoạt động công ty'}
                  {pathname.startsWith('/company/documents') && 'Tài liệu công ty'}
                  {pathname.startsWith('/company/posts') && 'Tin tức công ty'}
                </h1>
                <div className="flex items-center">
                  {/* Notification Dropdown */}
                  <div className="mr-5">
                    <NotificationDropdown limit={5} />
                  </div>
                  <div className="flex items-center mr-2">
                    <span className="text-sm text-gray-500 mr-3">
                      {session?.user?.name}
                      {session?.user?.role === 'ADMIN' && <span className="ml-2 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Quản trị viên</span>}
                      {session?.user?.role === 'DEPARTMENT_HEAD' && <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Trưởng phòng</span>}
                      {session?.user?.role === 'EMPLOYEE' && <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Nhân viên</span>}
                    </span>
                  </div>
                  <div className="relative">
                    <button 
                      ref={desktopButtonRef}
                      onClick={handleProfileClick}
                      className="h-10 w-10 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white font-medium shadow-md transition duration-150 duration-200 hover:shadow-lg transform hover:scale-105"
                      style={{ outline: 'none', cursor: 'pointer' }}
                    >
                      {getUserInitials(session?.user?.name)}
                    </button>
                    
                    {profileDropdownOpen && (
                      <div 
                        ref={desktopProfileDropdownRef} 
                        className="absolute right-0 mt-2 w-64 rounded-lg shadow-md bg-white ring-1 ring-gray-200 z-50 overflow-hidden transition duration-150 duration-200 transform origin-top-right animate-dropdown"
                        style={{
                          animation: 'fadeIn 0.2s ease-out forwards, slideIn 0.2s ease-out forwards'
                        }}
                      >
                        <div className="border-b border-gray-100 px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
                          <p className="text-xs text-gray-500 mt-1 truncate">{session?.user?.email}</p>
                        </div>
                        <div className="py-1">
                          <button
                            className="flex w-full items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 text-left"
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              toast.success('Tính năng đang được phát triển!', {
                                icon: '👨‍💻',
                              });
                            }}
                            style={{ cursor: 'pointer', outline: 'none' }}
                          >
                            <FiUser className="mr-3 h-4 w-4 text-gray-500" />
                            Thông tin cá nhân
                          </button>
                          <button
                            className="flex w-full items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 text-left"
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              toast.success('Tính năng đang được phát triển!', {
                                icon: '👨‍💻',
                              });
                            }}
                            style={{ cursor: 'pointer', outline: 'none' }}
                          >
                            <FiSettings className="mr-3 h-4 w-4 text-gray-500" />
                            Cài đặt tài khoản
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              signOut({ callbackUrl: '/login' });
                            }}
                            className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                            style={{ cursor: 'pointer', outline: 'none' }}
                          >
                            <FiLogOut className="mr-3 h-4 w-4 text-red-500" />
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Mobile page title - only visible on mobile */}
              <div className="md:hidden py-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  {pathname === '/dashboard' && 'Trang chủ'}
                  {pathname.startsWith('/employee/documents') && 'Tài liệu'}
                  {pathname.startsWith('/employee/announcements') && 'Thông báo'}
                  {pathname.startsWith('/employee/events') && 'Sự kiện'}
                  {pathname.startsWith('/manager/announcements') && 'Quản lý thông báo'}
                  {pathname.startsWith('/manager/documents') && 'Quản lý tài liệu'}
                  {pathname.startsWith('/manager/posts') && 'Quản lý bài viết'}
                  {pathname.startsWith('/admin/posts') && 'Quản lý bài viết'}
                  {pathname.startsWith('/manager/events') && 'Quản lý sự kiện'}
                  {pathname.startsWith('/admin/departments') && 'Quản lý phòng ban'}
                  {pathname.startsWith('/admin/users') && 'Quản lý người dùng'}
                  {pathname.startsWith('/admin/permissions') && 'Phân quyền'}
                  {pathname.startsWith('/admin/content-review') && 'Kiểm duyệt nội dung'}
                  {pathname.startsWith('/admin/announcements') && 'Thông báo hệ thống'}
                  {pathname === '/profile' && 'Thông tin cá nhân'}
                  {pathname === '/profile/settings' && 'Cài đặt tài khoản'}
                  {pathname.startsWith('/company/announcements') && 'Thông báo công ty'}
                  {pathname.startsWith('/company/events') && 'Hoạt động công ty'}
                  {pathname.startsWith('/company/documents') && 'Tài liệu công ty'}
                  {pathname.startsWith('/company/posts') && 'Tin tức công ty'}
                </h1>
              </div>
            </div>
            <div className="mx-auto px-4 sm:px-6 md:px-8 py-4">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 