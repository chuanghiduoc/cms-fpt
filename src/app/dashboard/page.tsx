'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { FiFileText, FiBell, FiCalendar, FiSearch, FiDownload, FiChevronRight, FiUsers, FiEdit, FiClock, FiMapPin, FiCheckSquare, FiFile } from 'react-icons/fi';
import {MdOutlineCorporateFare} from 'react-icons/md';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useNotifications } from '@/hooks/useNotifications';
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
const SkeletonCard = () => (
  <div className="bg-white rounded-xl p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
  </div>
);

const SkeletonList = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center space-x-3 animate-pulse">
        <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
    loading: notificationsLoading
  } = useNotifications({ limit: 5 });

  // Category mappings for display
  const categoryMapping: Record<string, { label: string, color: string }> = {
    'REPORT': { label: 'Báo cáo', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    'CONTRACT': { label: 'Hợp đồng', color: 'bg-green-50 text-green-700 border-green-200' },
    'GUIDE': { label: 'Hướng dẫn', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    'FORM': { label: 'Biểu mẫu', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    'OTHER': { label: 'Khác', color: 'bg-gray-50 text-gray-700 border-gray-200' }
  };

  // Fetch upcoming events
  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch(`/api/events?timeframe=upcoming&limit=5&sort=startDate:asc`);
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
      const departmentId = session?.user?.department || '';
      const response = await fetch(`/api/posts?limit=6&status=APPROVED&sort=createdAt:desc&departmentAccess=${departmentId}&includeAdminPosts=true`);
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

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      const departmentId = session?.user?.department || '';
      const response = await fetch(`/api/documents?limit=6&sort=createdAt:desc&status=APPROVED&departmentAccess=${departmentId}`);
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
  }, [session?.user?.department]);

  useEffect(() => {
    if (session?.user) {
      fetchEvents();
      fetchPosts();
      fetchDocuments();
    }
  }, [session, fetchEvents, fetchPosts, fetchDocuments]);

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

  // Open search modal
  const openSearchModal = useCallback(() => {
    setIsSearchModalOpen(true);
  }, []);

  // Add keyboard shortcut listener for search (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
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

      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chào mừng trở lại, {session?.user?.name}!
        </h1>
        <p className="text-gray-600">
          Tổng quan về hoạt động và thông tin quan trọng trong không gian làm việc của bạn
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div 
          className="relative cursor-text group"
          onClick={openSearchModal}
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
          </div>
          <div className="block w-full rounded-xl border border-gray-200 pl-12 pr-20 py-4 text-gray-500 bg-white hover:border-orange-300 hover:shadow-sm transition-all cursor-text">
            Tìm kiếm tài liệu, thông báo, sự kiện...
          </div>
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <kbd className="px-2 py-1 rounded border border-gray-300 bg-gray-50 font-mono">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 rounded border border-gray-300 bg-gray-50 font-mono">K</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions for Admin/Department Head */}
      {(isAdmin || isDepartmentHead) && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isAdmin ? (
              <>
                <Link href="/admin/users" className="group bg-white rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <FiUsers className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Quản lý người dùng</h3>
                      <p className="text-sm text-gray-500">Phân quyền & quản lý</p>
                    </div>
                  </div>
                </Link>
                <Link href="/admin/departments" className="group bg-white rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <MdOutlineCorporateFare className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Quản lý phòng ban</h3>
                      <p className="text-sm text-gray-500">Tổ chức & cấu trúc</p>
                    </div>
                  </div>
                </Link>
                <Link href="/admin/content-review" className="group bg-white rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <FiCheckSquare className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Kiểm duyệt nội dung</h3>
                      <p className="text-sm text-gray-500">Duyệt & xuất bản</p>
                    </div>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link href="/manager/documents/upload" className="group bg-white rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <FiFile className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Tải lên tài liệu</h3>
                      <p className="text-sm text-gray-500">Chia sẻ tài liệu</p>
                    </div>
                  </div>
                </Link>
                <Link href="/manager/announcements/create" className="group bg-white rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <FiBell className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Tạo thông báo</h3>
                      <p className="text-sm text-gray-500">Thông báo mới</p>
                    </div>
                  </div>
                </Link>
                <Link href="/manager/events/create" className="group bg-white rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <FiCalendar className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Tạo sự kiện</h3>
                      <p className="text-sm text-gray-500">Lịch họp & sự kiện</p>
                    </div>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Notifications & Events */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recent Notifications */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
                <Link href="/company/announcements" className="text-sm text-orange-600 hover:text-orange-700 flex items-center">
                  Xem tất cả <FiChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
            
            <div className="p-6">
              {notificationsLoading ? (
                <SkeletonList />
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <FiBell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Không có thông báo mới</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.slice(0, 3).map((notification) => (
                    <Link key={notification.id} href={`/company/announcements/${notification.id}`} className="block group">
                      <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${notification.isRead ? 'text-gray-600' : 'text-gray-900'} line-clamp-2`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(notification.createdAt)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Sự kiện sắp tới</h3>
                <Link href="/company/events" className="text-sm text-orange-600 hover:text-orange-700 flex items-center">
                  Xem tất cả <FiChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
            
            <div className="p-6">
              {loading.events ? (
                <SkeletonList />
              ) : events.length === 0 ? (
                <div className="text-center py-8">
                  <FiCalendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Không có sự kiện sắp tới</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.slice(0, 3).map((event) => (
                    <Link key={event.id} href={`/company/events/${event.id}`} className="block group">
                      <div className="p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <h4 className="font-medium text-gray-900 line-clamp-1 group-hover:text-orange-600">
                          {event.title}
                        </h4>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <FiClock className="h-4 w-4 mr-1" />
                          <span>{formatDate(event.startDate)} • {formatTime(event.startDate)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <FiMapPin className="h-4 w-4 mr-1" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Posts & Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Posts */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Tin tức mới nhất</h3>
                <Link href="/company/posts" className="text-sm text-orange-600 hover:text-orange-700 flex items-center">
                  Xem tất cả <FiChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
            
            <div className="p-6">
              {loading.posts ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <FiEdit className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Chưa có tin tức nào</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posts.slice(0, 4).map((post) => (
                    <Link key={post.id} href={`/company/posts/${post.id}`} className="group">
                      <article className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-all">
                        {post.coverImageUrl && (
                          <div className="h-32 bg-gray-200 overflow-hidden">
                            <img 
                              src={post.coverImageUrl} 
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                            {post.title}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                            {post.content.replace(/<[^>]*>?/gm, '')}
                          </p>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                            {post.department && (
                              <span className="text-xs text-gray-500">
                                {post.department.name}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Documents */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Tài liệu mới nhất</h3>
                <Link href="/company/documents" className="text-sm text-orange-600 hover:text-orange-700 flex items-center">
                  Xem tất cả <FiChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
            
            <div className="p-6">
              {loading.documents ? (
                <SkeletonList />
              ) : documents.length === 0 ? (
                <div className="text-center py-8">
                  <FiFileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Không có tài liệu nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.slice(0, 5).map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FiFileText className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 line-clamp-1">{document.title}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full border ${categoryMapping[document.category]?.color || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                              {categoryMapping[document.category]?.label || document.category}
                            </span>
                            <span className="text-xs text-gray-500">{formatDate(document.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <a 
                        href={document.filePath}
                        download
                        className="text-orange-600 hover:text-orange-700 p-2 rounded-lg hover:bg-orange-50 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FiDownload className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 