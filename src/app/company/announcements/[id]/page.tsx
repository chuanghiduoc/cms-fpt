'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { FiArrowLeft, FiCheckCircle, FiBell } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  departmentId?: string;
  isPublic: boolean;
  isRead: boolean;
  department?: {
    id: string;
    name: string;
  };
  readByUsers?: Array<{ id: string }>;
}

// Skeleton loading component for announcement detail
const AnnouncementSkeleton = () => (
  <div className="w-full py-6">
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center text-orange-600 gap-1 font-medium animate-pulse">
        <FiArrowLeft className="h-4 w-4" /> 
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
    
    <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-full flex-shrink-0">
              <FiBell className="h-6 w-6 text-orange-500" />
            </div>
            <div className="h-8 bg-gray-200 rounded w-72 animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center mt-4 text-sm text-gray-500 space-x-4">
          <div className="animate-pulse flex items-center">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="animate-pulse flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        
        <div className="mt-8 prose prose-orange lg:prose-lg w-full">
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [announcement, setAnnouncement] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch announcement details
  useEffect(() => {
    async function fetchAnnouncementDetails() {
      try {
        const response = await fetch(`/api/announcements/${id}`);
        if (response.ok) {
          const data = await response.json();
          // Add isRead flag
          const isRead = data.announcement.readByUsers?.some(
            (user: { id: string }) => user.id === session?.user?.id
          ) || false;
          
          setAnnouncement({
            ...data.announcement,
            isRead
          });
        } else {
          toast.error('Không thể tải thông báo');
        }
      } catch (error) {
        console.error('Error fetching announcement details:', error);
        toast.error('Đã xảy ra lỗi');
      } finally {
        setLoading(false);
      }
    }

    if (session?.user && id) {
      fetchAnnouncementDetails();
    }
  }, [id, session]);

  // Handle marking announcement as read
  const handleMarkAsRead = async () => {
    if (!announcement) return;
    
    try {
      const response = await fetch(`/api/announcements/${id}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAnnouncement({
          ...announcement,
          isRead: true
        });
        toast.success('Đã đánh dấu đã đọc');
      } else {
        toast.error(data.message || 'Không thể đánh dấu đã đọc');
      }
    } catch (error) {
      console.error('Error marking announcement as read:', error);
      toast.error('Đã xảy ra lỗi');
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy HH:mm');
  };

  if (loading) {
    return <AnnouncementSkeleton />;
  }

  if (!announcement) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FiBell className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-600 mb-6">Không tìm thấy thông báo</p>
        <button 
          onClick={() => router.push('/company/announcements')}
          className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm flex items-center"
        >
          <FiArrowLeft className="mr-2" /> Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="w-full py-6">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-orange-600 hover:text-orange-700 transition-colors gap-1 font-medium"
        >
          <FiArrowLeft className="h-4 w-4" /> Quay lại
        </button>
        
        {!announcement.isRead && (
          <button
            onClick={handleMarkAsRead}
            className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors text-sm font-medium shadow-sm"
          >
            <FiCheckCircle className="mr-1.5 h-4 w-4" /> Đánh dấu đã đọc
          </button>
        )}
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-full flex-shrink-0">
                <FiBell className="h-6 w-6 text-orange-500" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">{announcement.title}</h1>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center mt-4 text-sm text-gray-500 space-x-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
              <span className="font-medium text-gray-700">
                {announcement.department ? announcement.department.name : 'Toàn công ty'}
              </span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(announcement.createdAt)}</span>
            </div>
          </div>
          
          <div className="mt-8 prose prose-orange lg:prose-lg w-full">
            <div 
              dangerouslySetInnerHTML={{ __html: announcement.content }} 
              className="break-words"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 