'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FiBell, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AnnouncementForm from '@/components/announcements/AnnouncementForm';

export default function CreateSystemAnnouncementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    // Check permissions: only admin can create system announcements
    if (status === 'authenticated') {
      if (session.user.role !== 'ADMIN') {
        toast.error('Bạn không có quyền tạo thông báo hệ thống');
        router.push('/dashboard');
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);
  
  if (status === 'loading') {
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
  
  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/admin/announcements" className="mr-4 text-gray-500 hover:text-gray-700 cursor-pointer">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <FiBell className="mr-2 h-6 w-6 text-orange-500" />
            Tạo thông báo hệ thống mới
          </h1>
        </div>
      </div>
      
      <AnnouncementForm />
    </div>
  );
}
