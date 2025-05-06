'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FiBell, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import AnnouncementForm from '@/components/announcements/AnnouncementForm';
import toast from 'react-hot-toast';

export default function CreateAnnouncementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    // Check permissions: only admin and department heads can create announcements
    if (status === 'authenticated') {
      if (session.user.role !== 'ADMIN' && session.user.role !== 'DEPARTMENT_HEAD') {
        toast.error('Bạn không có quyền tạo thông báo');
        router.push('/dashboard');
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);
  
  if (status === 'loading') {
    return (
      <div className="space-y-6 pb-8 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-4 h-5 w-5 bg-gray-200 rounded"></div>
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <div className="h-10 w-1/3 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded w-full"></div>
            <div className="h-40 bg-gray-200 rounded w-full"></div>
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 w-1/4 bg-gray-200 rounded mt-6"></div>
          </div>
        </div>
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
            <FiBell className="mr-2 h-6 w-6 text-orange-500" />
            Tạo thông báo mới
          </h1>
        </div>
      </div>
      
      <AnnouncementForm />
    </div>
  );
} 