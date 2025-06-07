'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { FiArrowLeft, FiEdit2, FiTrash2, FiCalendar, FiUsers, FiEye } from 'react-icons/fi';
import Link from 'next/link';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

interface Announcement {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  readByUsers: {
    id: string;
    name: string;
    email: string;
  }[];
}

export default function SystemAnnouncementDetailPage() {
  const params = useParams();
  const announcementId = params.id as string;
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    // Check if user is admin
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      toast.error('Bạn không có quyền truy cập trang này');
      router.push('/dashboard');
      return;
    }
    
    if (status === 'authenticated' && announcementId) {
      fetchAnnouncement();
    }
  }, [status, announcementId, router, session]);
  
  const fetchAnnouncement = async () => {
    try {
      const response = await fetch(`/api/announcements/system/${announcementId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Thông báo không tồn tại');
          router.push('/admin/announcements');
          return;
        }
        
        if (response.status === 403) {
          toast.error('Bạn không có quyền xem thông báo này');
          router.push('/admin/announcements');
          return;
        }
        
        throw new Error('Failed to fetch system announcement');
      }
      
      const data = await response.json();
      setAnnouncement(data);
    } catch (error) {
      console.error('Error fetching system announcement:', error);
      toast.error('Đã xảy ra lỗi khi tải thông báo hệ thống');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/announcements/system/${announcementId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete system announcement');
      }
      
      toast.success('Đã xóa thông báo hệ thống thành công');
      router.push('/admin/announcements');
    } catch (error) {
      console.error('Error deleting system announcement:', error);
      toast.error('Đã xảy ra lỗi khi xóa thông báo hệ thống');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };
  
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
  
  if (loading || status === 'loading') {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between animate-pulse">
          <div className="flex items-center">
            <div className="mr-4 text-gray-300">
              <FiArrowLeft className="h-5 w-5" />
            </div>
            <div className="h-8 bg-gray-200 rounded w-64"></div>
          </div>
          
          <div className="flex space-x-3">
            <div className="h-9 bg-gray-200 rounded w-24"></div>
            <div className="h-9 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
        
        {/* Announcement metadata skeleton */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg animate-pulse">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <div className="h-5 bg-gray-200 rounded w-24"></div>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-64"></div>
                </div>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <div className="h-5 bg-gray-200 rounded w-28"></div>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <div className="h-5 bg-gray-200 rounded w-56"></div>
                </div>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <div className="h-5 bg-gray-200 rounded w-20"></div>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <div className="space-y-2">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="h-5 bg-gray-200 rounded w-full"></div>
                    ))}
                  </div>
                </div>
              </div>
            </dl>
          </div>
        </div>
        
        {/* Announcement content skeleton */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg animate-pulse">
          <div className="px-4 py-5 sm:px-6">
            <div className="h-6 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-3">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="h-4 bg-gray-200 rounded w-full"></div>
                ))}
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="h-4 bg-gray-200 rounded w-full"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!announcement) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy thông báo hoặc bạn không có quyền truy cập.</p>
        <Link 
          href="/admin/announcements"
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
        title="Xóa thông báo hệ thống"
        message="Bạn có chắc chắn muốn xóa thông báo hệ thống này? Hành động này không thể hoàn tác."
      />
      
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/admin/announcements" className="mr-4 text-gray-500 hover:text-gray-700 cursor-pointer">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            {/* <FiBell className="mr-2 h-6 w-6 text-orange-500" /> */}
            Chi tiết thông báo hệ thống
          </h1>
        </div>
        
        <div className="flex space-x-3">
          <Link
            href={`/admin/announcements/${announcement.id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 cursor-pointer"
          >
            <FiEdit2 className="mr-2 -ml-0.5 h-4 w-4" />
            Chỉnh sửa
          </Link>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
          >
            <FiTrash2 className="mr-2 -ml-0.5 h-4 w-4" />
            Xóa
          </button>
        </div>
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
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Nháp
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
                {announcement.createdBy.name} ({announcement.createdBy.email})
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiEye className="mr-2" /> Đã xem
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {announcement.readByUsers.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto">
                    <ul className="divide-y divide-gray-200">
                      {announcement.readByUsers.map((user) => (
                        <li key={user.id} className="py-2">
                          {user.name} ({user.email})
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <span className="text-gray-500">Chưa có người xem</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Announcement content */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Nội dung thông báo</h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: announcement.content }} />
          </div>
        </div>
      </div>
    </div>
  );
} 