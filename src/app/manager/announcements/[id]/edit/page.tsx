'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AnnouncementForm from '@/components/announcements/AnnouncementForm';

interface Announcement {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  departmentId: string | null;
  createdById?: string;
  createdBy?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
}

export default function EditAnnouncementPage() {
  const params = useParams();
  const announcementId = params.id as string;
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated' && announcementId) {
      fetchAnnouncement();
    }
  }, [status, announcementId, router]);
  
  const fetchAnnouncement = async () => {
    try {
      const response = await fetch(`/api/announcements/${announcementId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Thông báo không tồn tại');
          router.push('/manager/announcements');
          return;
        }
        
        if (response.status === 403) {
          toast.error('Bạn không có quyền chỉnh sửa thông báo này');
          router.push('/manager/announcements');
          return;
        }
        
        throw new Error('Failed to fetch announcement');
      }
      
      const data = await response.json();
      // Handle both data formats - direct or nested in announcement property
      const announcementData = data.announcement || data;
      setAnnouncement(announcementData);
      
      // Check if user has permission to edit
      const canEdit = 
        session?.user?.role === 'ADMIN' || 
        (session?.user?.role === 'DEPARTMENT_HEAD' && 
         session?.user?.department && announcementData.departmentId === session.user.department) ||
        session?.user?.id === announcementData.createdById;
      
      if (!canEdit) {
        console.log('Permission denied. User:', session?.user, 'Announcement:', announcementData);
        toast.error('Bạn không có quyền chỉnh sửa thông báo này');
        router.push('/manager/announcements');
      }
    } catch (error) {
      console.error('Error fetching announcement:', error);
      toast.error('Đã xảy ra lỗi khi tải thông báo');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading || status === 'loading') {
    return (
      <div className="space-y-6 pb-8 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-4 h-5 w-5 bg-gray-200 rounded"></div>
            <div className="h-8 w-56 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        {/* Creator info skeleton */}
        <div className="bg-white p-4 rounded-md shadow mb-4 flex items-center justify-between">
          <div className="h-5 w-48 bg-gray-200 rounded"></div>
          <div className="h-5 w-48 bg-gray-200 rounded"></div>
        </div>
        
        {/* Form skeleton */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <div className="space-y-4">
            <div className="h-10 w-1/3 bg-gray-200 rounded mb-6"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
            <div className="h-40 bg-gray-200 rounded w-full"></div>
            <div className="h-12 bg-gray-200 rounded w-1/3 mt-4"></div>
            <div className="h-10 w-1/4 bg-gray-200 rounded mt-6"></div>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/manager/announcements" className="mr-4 text-gray-500 hover:text-gray-700 cursor-pointer">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            {/* <FiBell className="mr-2 h-6 w-6 text-orange-500" /> */}
            Chỉnh sửa thông báo
          </h1>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-md shadow mb-4 flex items-center justify-between text-sm text-gray-500">
        <div>
          <span className="font-medium text-gray-700">Người tạo:</span> {announcement.createdBy?.name || 'N/A'}
        </div>
        <div>
          <span className="font-medium text-gray-700">Phòng ban:</span> {announcement.department?.name || 'Không có'}
        </div>
      </div>
      
      <AnnouncementForm announcement={announcement} isEditing={true} />
    </div>
  );
} 