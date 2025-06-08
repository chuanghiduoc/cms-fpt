'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiSave, FiArrowLeft, FiCalendar, FiMapPin, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function EditEventPage() {
  // Get params using useParams - in future Next.js versions, this will need to be
  // unwrapped with React.use() before accessing properties
  const params = useParams();
  const eventId = params.id as string;
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  // Fetch event data
  useEffect(() => {
    if (status === 'authenticated' && eventId) {
      fetchEvent();
    }
  }, [status, eventId]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Sự kiện không tồn tại');
          router.push('/manager/events');
          return;
        }
        throw new Error('Failed to fetch event');
      }
      
      const data = await response.json();
      
      // Set form data
      setTitle(data.title);
      setDescription(data.description || '');
      setLocation(data.location || '');
      
      // Format dates and times
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      
      setStartDate(formatDateForInput(start));
      setStartTime(formatTimeForInput(start));
      setEndDate(formatDateForInput(end));
      setEndTime(formatTimeForInput(end));
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Đã xảy ra lỗi khi tải thông tin sự kiện');
      router.push('/manager/events');
    }
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeForInput = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-5 h-5 mr-4 bg-gray-200 rounded animate-pulse"></div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <div className="w-6 h-6 mr-2 bg-gray-200 rounded-full animate-pulse"></div>
              Chỉnh sửa sự kiện
            </h1>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Title skeleton */}
            <div>
              <div className="h-5 w-24 bg-gray-200 rounded mb-1 animate-pulse"></div>
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            {/* Description skeleton */}
            <div>
              <div className="h-5 w-16 bg-gray-200 rounded mb-1 animate-pulse"></div>
              <div className="h-24 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            {/* Location skeleton */}
            <div>
              <div className="h-5 w-20 bg-gray-200 rounded mb-1 animate-pulse"></div>
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            {/* Date & Time skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="h-5 w-32 bg-gray-200 rounded mb-1 animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div>
                <div className="h-5 w-24 bg-gray-200 rounded mb-1 animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div>
                <div className="h-5 w-32 bg-gray-200 rounded mb-1 animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div>
                <div className="h-5 w-24 bg-gray-200 rounded mb-1 animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Buttons skeleton */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (session?.user?.role !== 'DEPARTMENT_HEAD') {
    router.push('/dashboard');
    toast.error('Bạn không có quyền truy cập trang này');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề sự kiện');
      return;
    }
    
    if (!startDate || !startTime) {
      toast.error('Vui lòng chọn thời gian bắt đầu');
      return;
    }
    
    if (!endDate || !endTime) {
      toast.error('Vui lòng chọn thời gian kết thúc');
      return;
    }
    
    // Validate dates
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    
    if (endDateTime <= startDateTime) {
      toast.error('Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }
    
    setSaving(true);
    
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          location,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          isPublic: false
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update event');
      }
      
      toast.success('Cập nhật sự kiện thành công');
      router.push(`/manager/events/${eventId}`);
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Đã xảy ra lỗi khi cập nhật sự kiện');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href={`/manager/events/${eventId}`}
            className="mr-4 text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            {/* <FiCalendar className="mr-2 h-6 w-6 text-orange-500" /> */}
            Chỉnh sửa sự kiện
          </h1>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              id="description"
              rows={4}
              className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
              value={description || ''}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Địa điểm
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <FiMapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="location"
                className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
                value={location || ''}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Nhập địa điểm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="startDate"
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                Giờ bắt đầu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <FiClock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="time"
                  id="startTime"
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="endDate"
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                Giờ kết thúc <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <FiClock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="time"
                  id="endTime"
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Link 
              href={`/manager/events/${eventId}`}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 outline-none cursor-pointer"
            >
              Hủy bỏ
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-orange-700 outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              {!saving && <FiSave className="ml-2 -mr-1 h-4 w-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 