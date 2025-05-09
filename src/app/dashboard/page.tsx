'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { FiFileText, FiBell, FiCalendar, FiSearch, FiDownload, FiChevronRight, FiUsers, FiEdit, FiPlusCircle } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import SearchModal from '@/components/SearchModal';

// Define types for the data structures
interface Event {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  createdById: string;
  departmentId?: string;
  isPublic: boolean;
  department?: {
    id: string;
    name: string;
  };
}

interface Document {
  id: string;
  title: string;
  description?: string;
  category: string;
  filePath: string;
  createdAt: string;
  departmentId?: string;
  isPublic: boolean;
  department?: {
    id: string;
    name: string;
  };
}

interface Post {
  id: string;
  title: string;
  content: string;
  coverImageUrl: string | null;
  isPublic: boolean;
  status: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    role?: string;
  };
  department: {
    id: string;
    name: string;
  } | null;
}

// Skeleton loading components
const NotificationSkeleton = () => (
  <div className="p-6 space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse">
        <div className="flex justify-between">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-gray-200 rounded-full mr-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="mt-2 h-3 bg-gray-200 rounded w-full"></div>
        <div className="mt-3 flex justify-between">
          <div className="h-3 bg-gray-200 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    ))}
  </div>
);

const DocumentTableSkeleton = () => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Tiêu đề
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Phân loại
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Phòng ban
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Ngày
          </th>
          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Thao tác
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {[1, 2, 3, 4].map((i) => (
          <tr key={i} className="animate-pulse">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="h-4 bg-gray-200 rounded w-36"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="h-5 bg-gray-200 rounded-full w-20"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right">
              <div className="h-4 bg-gray-200 rounded w-24 ml-auto"></div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PostSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-4/6 mb-4"></div>
        <div className="flex justify-between mt-4">
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    ))}
  </div>
);

export default function DashboardPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const isDepartmentHead = session?.user?.role === 'DEPARTMENT_HEAD';
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // State for data
  const [documents, setDocuments] = useState<Document[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState({
    documents: true,
    events: true,
    posts: true,
  });
  const { 
    notifications, 
    loading: notificationsLoading, 
    markAsRead 
  } = useNotifications({ limit: 3 });

  // Category mappings for display
  const categoryMapping: Record<string, { label: string, bgClass: string, textClass: string }> = {
    'REPORT': { label: 'Báo cáo', bgClass: 'bg-blue-100', textClass: 'text-blue-800' },
    'CONTRACT': { label: 'Hợp đồng', bgClass: 'bg-green-100', textClass: 'text-green-800' },
    'GUIDE': { label: 'Hướng dẫn', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
    'FORM': { label: 'Biểu mẫu', bgClass: 'bg-purple-100', textClass: 'text-purple-800' },
    'OTHER': { label: 'Khác', bgClass: 'bg-gray-100', textClass: 'text-gray-800' }
  };

  // State for document categories
  const [activeCategory, setActiveCategory] = useState('all');
  const documentCategories = [
    { id: 'all', name: 'Tất cả' },
    { id: 'REPORT', name: 'Báo cáo' },
    { id: 'CONTRACT', name: 'Hợp đồng' },
    { id: 'GUIDE', name: 'Hướng dẫn' },
    { id: 'FORM', name: 'Biểu mẫu' },
    { id: 'OTHER', name: 'Khác' },
  ];

  // Fetch upcoming events
  const fetchEvents = useCallback(async () => {
    try {
      // The API already handles proper visibility filtering based on user's role:
      // - Admins see all events
      // - Department heads and employees see public events + their department's events
      const response = await fetch(`/api/events?timeframe=upcoming&limit=3&sort=startDate:asc`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Không thể tải sự kiện');
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      // Fetch approved posts for dashboard
      const departmentId = session?.user?.department || '';
      const response = await fetch(`/api/posts?limit=3&status=APPROVED&sort=createdAt:desc&departmentAccess=${departmentId}&includeAdminPosts=true`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Không thể tải tin tức');
    } finally {
      setLoading(prev => ({ ...prev, posts: false }));
    }
  }, [session?.user?.department]);

  useEffect(() => {
    if (session?.user) {
      fetchEvents();
      fetchPosts();
    }
  }, [session, fetchEvents, fetchPosts]);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      // Lấy tài liệu theo điều kiện:
      // 1. Tài liệu cùng phòng (bất kể public hay không)
      // 2. Tài liệu khác phòng nhưng là public
      const category = activeCategory !== 'all' ? `&category=${activeCategory}` : '';
      const departmentId = session?.user?.department || '';
      const response = await fetch(`/api/documents?limit=4${category}&sort=createdAt:desc&status=APPROVED&departmentAccess=${departmentId}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Không thể tải tài liệu');
    } finally {
      setLoading(prev => ({ ...prev, documents: false }));
    }
  }, [activeCategory, session?.user?.department]);

  useEffect(() => {
    if (session?.user) {
      fetchDocuments();
    }
  }, [session, fetchDocuments]);

  // Format date for display
  const formatDate = useCallback((dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy');
  }, []);

  // Format time for display
  const formatTime = useCallback((dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'HH:mm');
  }, []);

  // Handle marking notification as read
  const handleMarkAsRead = useCallback(async (notificationId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    await markAsRead(notificationId);
  }, [markAsRead]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  // Open search modal
  const openSearchModal = useCallback(() => {
    setIsSearchModalOpen(true);
  }, []);

  // Add keyboard shortcut listener for search (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault(); // Prevent browser default behavior
        setIsSearchModalOpen(prev => !prev); // Toggle the search modal
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-6">
      {/* Search Modal */}
      {isSearchModalOpen && (
        <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
      )}

      {/* Phần chào mừng */}
      <motion.div 
        className="bg-white shadow rounded-lg p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl font-semibold text-gray-800">
          Chào mừng trở lại, {session?.user?.name}!
        </h2>
        <p className="mt-1 text-gray-600">
          Đây là những gì đang diễn ra trong không gian làm việc của bạn hôm nay.
        </p>
      </motion.div>

      {/* Tìm kiếm nhanh */}
      <motion.div 
        className="bg-white shadow rounded-lg p-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div 
          className="relative cursor-text group hover:shadow-md transition-shadow rounded-md"
          onClick={openSearchModal}
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
          </div>
          <div
            className="block w-full rounded-md border border-gray-300 pl-10 pr-4 py-3 text-gray-500 bg-white hover:border-orange-300 transition-colors focus:outline-none cursor-text"
          >
            Tìm kiếm tài liệu, thông báo, sự kiện...
          </div>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs text-gray-400">
            <kbd className="mx-1 px-2 py-0.5 rounded border border-gray-300 bg-gray-100 font-sans">Ctrl</kbd>
            <span>+</span>
            <kbd className="mx-1 px-2 py-0.5 rounded border border-gray-300 bg-gray-100 font-sans">K</kbd>
          </div>
        </div>
      </motion.div>

      {/* Các chức năng quản trị dành cho Admin */}
      {isAdmin && (
        <motion.div 
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <Link href="/admin/users" className="block">
              <div className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-100 text-orange-600 mb-4">
                  <FiUsers className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Quản lý người dùng</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Thêm, sửa, xóa người dùng và phân quyền cho từng người dùng.
                </p>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-orange-600">Truy cập</span>
                <FiChevronRight className="h-5 w-5 text-orange-500" />
              </div>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <Link href="/admin/departments" className="block">
              <div className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600 mb-4">
                  <FiUsers className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Quản lý phòng ban</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Tạo, chỉnh sửa và quản lý các phòng ban trong công ty.
                </p>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-blue-600">Truy cập</span>
                <FiChevronRight className="h-5 w-5 text-blue-500" />
              </div>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <Link href="/admin/content-review" className="block">
              <div className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-100 text-green-600 mb-4">
                  <FiEdit className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Kiểm duyệt nội dung</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Duyệt các thông báo, bài viết và tài liệu trước khi xuất bản.
                </p>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-green-600">Truy cập</span>
                <FiChevronRight className="h-5 w-5 text-green-500" />
              </div>
            </Link>
          </motion.div>
        </motion.div>
      )}
      
      {/* Các chức năng dành cho Trưởng phòng */}
      {isDepartmentHead && (
        <motion.div 
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <Link href="/manager/documents" className="block">
              <div className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600 mb-4">
                  <FiFileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Quản lý tài liệu</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Quản lý tài liệu và phân phối cho phòng ban.
                </p>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-blue-600">Truy cập</span>
                <FiChevronRight className="h-5 w-5 text-blue-500" />
              </div>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <Link href="/manager/announcements" className="block">
              <div className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-yellow-100 text-yellow-600 mb-4">
                  <FiBell className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Quản lý thông báo</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Tạo và quản lý thông báo cho phòng ban của bạn.
                </p>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-yellow-600">Truy cập</span>
                <FiChevronRight className="h-5 w-5 text-yellow-500" />
              </div>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <Link href="/manager/events" className="block">
              <div className="p-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-100 text-green-600 mb-4">
                  <FiCalendar className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Quản lý sự kiện</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Tạo và quản lý sự kiện hoặc lịch họp cho phòng ban.
                </p>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-green-600">Truy cập</span>
                <FiChevronRight className="h-5 w-5 text-green-500" />
              </div>
            </Link>
          </motion.div>
        </motion.div>
      )}

      <motion.div 
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {/* Thông báo gần đây */}
        <motion.div 
          className="bg-white shadow rounded-lg overflow-hidden"
          variants={fadeInVariants}
        >
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FiBell className="mr-2 h-5 w-5 text-gray-500" />
              Thông báo gần đây
            </h3>
            <div className="flex items-center space-x-2">
              {isDepartmentHead && (
                <Link href="/manager/announcements/create" className="text-sm text-green-600 hover:text-green-800 flex items-center mr-3">
                  <FiPlusCircle className="mr-1 h-4 w-4" /> Tạo mới
                </Link>
              )}
              <Link href="/company/announcements" className="text-sm text-orange-600 hover:text-orange-800 flex items-center">
                Xem tất cả <FiChevronRight className="ml-1" />
              </Link>
            </div>
          </div>
          
          {notificationsLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <NotificationSkeleton />
            </motion.div>
          ) : notifications.length === 0 ? (
            <motion.div 
              className="p-6 text-center text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              Không có thông báo nào
            </motion.div>
          ) : (
            <motion.ul 
              className="divide-y divide-gray-200"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {notifications.map((notification) => (
                  <motion.li 
                    key={notification.id}
                    variants={itemVariants}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Link href={`/company/announcements/${notification.id}`} className="block hover:bg-gray-50">
                      <div className="px-6 py-4">
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            {!notification.isRead && (
                              <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-2"
                              ></motion.span>
                            )}
                            <p className={`text-sm font-medium ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                              {notification.title}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">{formatDate(notification.createdAt)}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-1">{notification.content}</p>
                        <div className="mt-2 flex justify-between">
                          <span className="inline-flex items-center text-xs font-medium text-orange-600 hover:text-orange-800">
                            Đọc tiếp <FiChevronRight className="ml-1 h-3 w-3" />
                          </span>
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                            style={{ visibility: notification.isRead ? 'hidden' : 'visible' }}
                          >
                            Đánh dấu đã đọc
                          </motion.button>
                        </div>
                      </div>
                    </Link>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </motion.div>

        {/* Sự kiện sắp tới */}
        <motion.div 
          className="bg-white shadow rounded-lg overflow-hidden"
          variants={fadeInVariants}
        >
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FiCalendar className="mr-2 h-5 w-5 text-gray-500" />
              Sự kiện sắp tới
            </h3>
            <div className="flex items-center space-x-2">
              {isDepartmentHead && (
                <Link href="/manager/events/create" className="text-sm text-green-600 hover:text-green-800 flex items-center mr-3">
                  <FiPlusCircle className="mr-1 h-4 w-4" /> Tạo mới
                </Link>
              )}
              <Link href="/company/events" className="text-sm text-orange-600 hover:text-orange-800 flex items-center">
                Xem tất cả <FiChevronRight className="ml-1" />
              </Link>
            </div>
          </div>
          
          {loading.posts ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <PostSkeleton />
            </motion.div>
          ) : events.length === 0 ? (
            <motion.div 
              className="p-6 text-center text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              Không có sự kiện sắp tới
            </motion.div>
          ) : (
            <motion.ul 
              className="divide-y divide-gray-200"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {events.map((event) => (
                <motion.li 
                  key={event.id}
                  variants={itemVariants}
                >
                  <Link href={`/company/events/${event.id}`} className="block hover:bg-gray-50">
                    <div className="px-6 py-4">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">{formatDate(event.startDate)}</p>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <span>{formatTime(event.startDate)}</span>
                        <span className="mx-1">•</span>
                        <span>{event.location || 'Không xác định'}</span>
                      </div>
                      <div className="mt-2">
                        <span className="inline-flex items-center text-xs font-medium text-orange-600 hover:text-orange-800">
                          Xem chi tiết <FiChevronRight className="ml-1 h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </motion.div>
      </motion.div>

      {/* Tin tức phần mới */}
      <motion.div 
        className="bg-white shadow rounded-lg overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FiEdit className="mr-2 h-5 w-5 text-gray-500" />
            Tin tức
          </h3>
          <div className="flex items-center space-x-2">
            {isDepartmentHead && (
              <Link href="/manager/posts/create" className="text-sm text-green-600 hover:text-green-800 flex items-center mr-3">
                <FiPlusCircle className="mr-1 h-4 w-4" /> Tạo mới
              </Link>
            )}
            <Link href="/company/posts" className="text-sm text-orange-600 hover:text-orange-800 flex items-center">
              Xem tất cả <FiChevronRight className="ml-1" />
            </Link>
          </div>
        </div>
        
        <div className="p-6">
          {loading.posts ? (
            <PostSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {posts && posts.length > 0 ? (
                posts.slice(0, 3).map((post) => (
                  <motion.div
                    key={post.id}
                    className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors"
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    variants={itemVariants}
                  >
                    <Link href={`/company/posts/${post.id}`} className="block">
                      <h4 className="text-md font-medium text-gray-900 mb-2">{post.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {post.content.replace(/<[^>]*>?/gm, '').substring(0, 120)}...
                      </p>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                        <span className="text-xs text-orange-600 hover:text-orange-800 flex items-center">
                          Đọc tiếp <FiChevronRight className="ml-1 h-3 w-3" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-3 text-center text-gray-500 py-8">
                  Không có tin tức nào
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Tài liệu phần mới */}
      <motion.div 
        className="bg-white shadow rounded-lg overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FiFileText className="mr-2 h-5 w-5 text-gray-500" />
            Tài liệu
          </h3>
          <div className="flex items-center space-x-2">
            {isDepartmentHead && (
              <Link href="/manager/documents/upload" className="text-sm text-green-600 hover:text-green-800 flex items-center mr-3">
                <FiPlusCircle className="mr-1 h-4 w-4" /> Tải lên
              </Link>
            )}
            <Link href="/company/documents" className="text-sm text-orange-600 hover:text-orange-800 flex items-center">
              Xem tất cả <FiChevronRight className="ml-1" />
            </Link>
          </div>
        </div>

        {/* Filter categories */}
        <div className="px-6 py-2 border-b border-gray-200 flex overflow-x-auto">
          <AnimatePresence>
            {documentCategories.map((category) => (
              <motion.button
                key={category.id}
                className={`mr-2 px-3 py-1 rounded-full text-sm font-medium ${
                  activeCategory === category.id 
                    ? category.id === 'all'
                      ? 'bg-orange-100 text-orange-700' 
                      : `${categoryMapping[category.id]?.bgClass || 'bg-orange-100'} ${categoryMapping[category.id]?.textClass || 'text-orange-700'}`
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                onClick={() => setActiveCategory(category.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                layout
              >
                {category.name}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {loading.documents ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <DocumentTableSkeleton />
          </motion.div>
        ) : documents.length === 0 ? (
          <motion.div 
            className="p-6 text-center text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Không có tài liệu nào
          </motion.div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tiêu đề
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phân loại
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phòng ban
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <motion.tbody 
                className="bg-white divide-y divide-gray-200"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence>
                  {documents.map((document) => (
                    <motion.tr 
                      key={document.id} 
                      className="hover:bg-gray-50"
                      variants={itemVariants}
                      layout
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{document.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${categoryMapping[document.category]?.bgClass || 'bg-blue-100'} ${categoryMapping[document.category]?.textClass || 'text-blue-800'}`}>
                          {categoryMapping[document.category]?.label || document.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{document.department?.name || 'Công ty'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(document.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <motion.a 
                          href={document.filePath}
                          download
                          className="text-orange-600 hover:text-orange-900 inline-flex items-center cursor-pointer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FiDownload className="mr-1 h-4 w-4" /> Tải xuống
                        </motion.a>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </motion.tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
} 