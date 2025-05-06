'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { FiBell, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AnnouncementForm from '@/components/announcements/AnnouncementForm';

interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  departmentId: string | null;
  createdBy?: {
    id: string;
    name: string;
  };
}

export default function EditSystemAnnouncementPage() {
  const params = useParams();
  const announcementId = params.id as string;
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [loading, setLoading] = useState(true);
  
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
          toast.error('Bạn không có quyền chỉnh sửa thông báo này');
          router.push('/admin/announcements');
          return;
        }
        
        throw new Error('Failed to fetch system announcement');
      }
      
      const data = await response.json();
      setAnnouncement(data);
    } catch (error) {
      console.error('Error fetching system announcement:', error);
      toast.error('Đã xảy ra lỗi khi tải thông báo');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading || status === 'loading') {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-4 text-gray-300">
              <FiArrowLeft className="h-5 w-5" />
            </div>
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-md shadow mb-4 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-60"></div>
        </div>
        
        <div className="animate-pulse space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              
              <div className="h-6 bg-gray-200 rounded w-1/4 mt-6"></div>
              <div className="h-64 bg-gray-200 rounded w-full"></div>
              
              <div className="flex items-center mt-4">
                <div className="h-5 w-5 bg-gray-200 rounded mr-2"></div>
                <div className="h-5 bg-gray-200 rounded w-40"></div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-8">
                <div className="h-10 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/admin/announcements" className="mr-4 text-gray-500 hover:text-gray-700 cursor-pointer">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <FiBell className="mr-2 h-6 w-6 text-orange-500" />
            Chỉnh sửa thông báo hệ thống
          </h1>
        </div>
      </div>
      
      {announcement.createdBy && (
        <div className="bg-white p-4 rounded-md shadow mb-4 flex items-center justify-between text-sm text-gray-500">
          <div>
            <span className="font-medium text-gray-700">Người tạo:</span> {announcement.createdBy.name || 'N/A'}
          </div>
        </div>
      )}
      
      <AnnouncementForm announcement={announcement} isEditing={true} />
    </div>
  );
} 