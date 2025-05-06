'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { FiBell, FiArrowLeft, FiEdit2, FiTrash2, FiCalendar, FiUsers, FiEye } from 'react-icons/fi';
import Link from 'next/link';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

interface Announcement {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  departmentId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  department?: {
    id: string;
    name: string;
  };
  readByUsers: {
    id: string;
    name: string;
    email: string;
  }[];
}

export default function AnnouncementDetailPage() {
  const params = useParams();
  const announcementId = params.id as string;
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  useEffect(() => {
    console.debug('Session status changed:', status);
    console.debug('Current session data:', session);
    
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    let abortController: AbortController | undefined;
    
    if (status === 'authenticated' && announcementId) {
      console.debug('Session authenticated, fetching announcement');
      console.debug('Current session state:', session);
      
      // Create abort controller only when we're making the request
      abortController = new AbortController();
      fetchAnnouncement(abortController.signal);
      
      // Cleanup function
      return () => {
        console.debug('Cancelling any pending fetch requests');
        abortController?.abort();
      };
    }
  }, [status, announcementId, router, session]);
  
  const fetchAnnouncement = async (signal?: AbortSignal) => {
    try {
      console.debug('Fetching announcement with ID:', announcementId);
      const response = await fetch(`/api/announcements/${announcementId}`, { signal });
      
      // Check if the request was aborted before proceeding
      if (signal?.aborted) {
        console.log('Fetch aborted before response processing');
        return;
      }
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Thông báo không tồn tại');
          router.push('/manager/announcements');
          return;
        }
        
        if (response.status === 403) {
          toast.error('Bạn không có quyền xem thông báo này');
          router.push('/manager/announcements');
          return;
        }
        
        throw new Error('Failed to fetch announcement');
      }
      
      const data = await response.json();
      
      // Check if the request was aborted before setting state
      if (signal?.aborted) {
        console.log('Fetch aborted after response received');
        return;
      }
      
      console.debug('Announcement data structure:', JSON.stringify(data, null, 2));
      
      // Extract announcement from the nested structure
      const announcementData = data.announcement || data;
      console.debug('createdBy property:', announcementData.createdBy);
      
      // Ensure the announcement data has all required properties or provide defaults
      const validatedData = {
        ...announcementData,
        id: announcementData.id || '',
        title: announcementData.title || '',
        content: announcementData.content || '',
        isPublic: !!announcementData.isPublic,
        departmentId: announcementData.departmentId || null,
        createdAt: announcementData.createdAt || new Date().toISOString(),
        updatedAt: announcementData.updatedAt || new Date().toISOString(),
        createdBy: announcementData.createdBy || { id: '', name: 'Unknown', email: '' },
        department: announcementData.department || null,
        readByUsers: Array.isArray(announcementData.readByUsers) ? announcementData.readByUsers : []
      };
      
      setAnnouncement(validatedData);
      
      // Get current session at the time this runs to avoid stale closures
      const currentSession = await fetch('/api/auth/session').then(res => res.json());
      
      // Debug session and announcement objects
      console.debug('Current session user (from state):', session?.user);
      console.debug('Current session (from fresh fetch):', currentSession);
      console.debug('Session structure:', JSON.stringify(session, null, 2));
    } catch (error) {
      // Don't show error message if the request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      
      console.error('Error fetching announcement:', error);
      toast.error('Đã xảy ra lỗi khi tải thông báo');
    } finally {
      // Only update loading state if request wasn't aborted
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };
  
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/announcements/${announcementId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Bạn không có quyền xóa thông báo này');
          return;
        }
        throw new Error('Failed to delete announcement');
      }
      
      toast.success('Đã xóa thông báo thành công');
      router.push('/manager/announcements');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Đã xảy ra lỗi khi xóa thông báo');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };
  
  // Create a safe representation of the session data to avoid undefined errors
  const safeUserId = session?.user?.id || null;
  const safeUserRole = session?.user?.role || null;
  const safeUserDepartment = session?.user?.department || null;
  
  // Check if user has permission to edit/delete using a try-catch to prevent any potential errors
  let canModify = false;
  try {
    canModify = Boolean(
      announcement && (
        safeUserRole === 'ADMIN' || 
        (safeUserRole === 'DEPARTMENT_HEAD' && 
         safeUserDepartment && announcement.departmentId && 
         safeUserDepartment === announcement.departmentId) ||
        (safeUserId && announcement.createdBy && announcement.createdBy.id && 
         safeUserId === announcement.createdBy.id)
      )
    );
  } catch (error) {
    console.error('Error determining modify permissions:', error);
    canModify = false;
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading || status === 'loading' || !session) {
    return (
      <div className="space-y-6 pb-8 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-4 h-5 w-5 bg-gray-200 rounded"></div>
            <div className="h-8 w-64 bg-gray-200 rounded"></div>
          </div>
          <div className="flex space-x-3">
            <div className="h-9 w-24 bg-gray-200 rounded"></div>
            <div className="h-9 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        {/* Announcement metadata skeleton */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <div className="h-7 w-80 bg-gray-200 rounded"></div>
              <div className="mt-1 h-5 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <div className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <div className="h-5 w-24 bg-gray-200 rounded"></div>
                <div className="mt-1 h-5 w-full bg-gray-200 rounded"></div>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <div className="h-5 w-24 bg-gray-200 rounded"></div>
                <div className="mt-1 h-5 w-full bg-gray-200 rounded"></div>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <div className="h-5 w-24 bg-gray-200 rounded"></div>
                <div className="mt-1 h-5 w-full bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Announcement content skeleton */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <div className="h-7 w-48 bg-gray-200 rounded"></div>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!announcement || !session.user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy thông báo hoặc bạn không có quyền truy cập.</p>
        <Link 
          href="/manager/announcements"
          className="mt-4 inline-block text-orange-600 hover:text-orange-800 cursor-pointer"
        >
          Quay lại danh sách thông báo
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-8">
      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Xóa thông báo"
        message="Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác."
      />
      
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/manager/announcements" className="mr-4 text-gray-500 hover:text-gray-700 cursor-pointer">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <FiBell className="mr-2 h-6 w-6 text-orange-500" />
            Chi tiết thông báo
          </h1>
        </div>
        
        {canModify && (
          <div className="flex space-x-3">
            <Link
              href={`/manager/announcements/${announcement.id}/edit`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              <FiEdit2 className="mr-2 -ml-0.5 h-4 w-4" />
              Chỉnh sửa
            </Link>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 cursor-pointer"
            >
              <FiTrash2 className="mr-2 -ml-0.5 h-4 w-4" />
              Xóa
            </button>
          </div>
        )}
      </div>
      
      {/* Announcement metadata */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {announcement.title}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {announcement.isPublic ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Công khai
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Nội bộ
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiCalendar className="mr-2" /> Thời gian
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div>Tạo lúc: {formatDate(announcement.createdAt)}</div>
                {announcement.createdAt !== announcement.updatedAt && (
                  <div className="text-gray-500">
                    Cập nhật lần cuối: {formatDate(announcement.updatedAt)}
                  </div>
                )}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiUsers className="mr-2" /> Người tạo
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {announcement.createdBy && announcement.createdBy.name ? 
                  `${announcement.createdBy.name} (${announcement.createdBy.email || ''})` : 
                  'Không có thông tin'
                }
              </dd>
            </div>
            {announcement.department && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Phòng ban</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {announcement.department.name}
                </dd>
              </div>
            )}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiEye className="mr-2" /> Đã xem
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {announcement.readByUsers && announcement.readByUsers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {(announcement.readByUsers || []).map(user => (
                      <span 
                        key={user.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        title={user.email}
                      >
                        {user.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500">Chưa có ai xem</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Announcement content */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Nội dung thông báo
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="prose max-w-none">
            {announcement.content ? 
              announcement.content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))
              : <p>Không có nội dung</p>
            }
          </div>
        </div>
      </div>
    </div>
  );
} 