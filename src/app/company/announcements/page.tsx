'use client';

import { useState, useEffect } from 'react';
import { FiBell, FiSearch, FiChevronRight, FiCheckCircle } from 'react-icons/fi';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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

// Skeleton component for loading state
const AnnouncementSkeleton = () => {
  return (
    <div className="p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="flex items-center mt-1">
            <div className="h-4 bg-gray-200 rounded w-24 mr-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1 mx-1"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full mt-3"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mt-2"></div>
          <div className="mt-3 flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <div className="h-3 w-3 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default function EmployeeAnnouncementsPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [announcements, setAnnouncements] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch announcements
  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const response = await fetch('/api/announcements');
        if (response.ok) {
          const data = await response.json();
          
          // Process announcements to include isRead flag
          const processedAnnouncements = data.announcements.map((announcement: Notification) => ({
            ...announcement,
            isRead: announcement.readByUsers?.some((user: { id: string }) => user.id === session?.user?.id) || false
          }));
          
          setAnnouncements(processedAnnouncements || []);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
        toast.error('Không thể tải thông báo');
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchAnnouncements();
    }
  }, [session]);

  // Filter announcements based on search query
  const filteredAnnouncements = announcements.filter(
    announcement => 
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (announcement.department?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle marking announcement as read
  const handleMarkAsRead = async (announcementId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      const response = await fetch(`/api/announcements/${announcementId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update the local state to reflect the change
        setAnnouncements(prevAnnouncements => 
          prevAnnouncements.map(announcement => 
            announcement.id === announcementId 
              ? { ...announcement, isRead: true } 
              : announcement
          )
        );
        
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
    return format(date, 'dd/MM/yyyy');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <motion.div 
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-white shadow rounded-lg p-4"
      >
        {/* Search bar - improved UI */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
            placeholder="Tìm kiếm theo tiêu đề, nội dung hoặc phòng ban..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {searchQuery && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 text-sm text-gray-500 overflow-hidden"
            >
              {filteredAnnouncements.length} kết quả tìm thấy
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Announcements list */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", delay: 0.1 }}
        className="bg-white shadow rounded-lg overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <FiBell className="mr-2 h-5 w-5 text-orange-500" />
            </motion.div>
            Danh sách thông báo
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {loading ? (
            <>
              <div className="px-6 py-3 bg-gray-50 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-48"></div>
              </div>
              {[...Array(3)].map((_, index) => (
                <AnnouncementSkeleton key={index} />
              ))}
            </>
          ) : filteredAnnouncements.length > 0 ? (
            <AnimatePresence>
              {filteredAnnouncements.map((announcement, index) => (
                <motion.div 
                  key={announcement.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-6 hover:bg-gray-50 transition-colors duration-150 ${!announcement.isRead ? 'border-l-4 border-orange-500' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className={`text-md font-medium ${announcement.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                          {announcement.title}
                        </h3>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <span>{formatDate(announcement.createdAt)}</span>
                        <span className="mx-1">•</span>
                        <span className="font-medium text-orange-600">{announcement.department?.name || 'Toàn công ty'}</span>
                      </div>
                      <p className="mt-3 text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
                      <div className="mt-3 flex justify-between items-center">
                        <Link href={`/company/announcements/${announcement.id}`} 
                          className="text-sm font-medium text-orange-600 hover:text-orange-800 flex items-center group focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-opacity-60 rounded-md px-2 py-1 -mx-2 -my-1">
                          Xem chi tiết 
                          <motion.div
                            initial={{ x: 0 }}
                            whileHover={{ x: 5 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <FiChevronRight className="ml-1 h-4 w-4" />
                          </motion.div>
                        </Link>
                        {!announcement.isRead && (
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => handleMarkAsRead(announcement.id, e)}
                            className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors flex items-center focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-60"
                          >
                            <FiCheckCircle className="mr-1 h-4 w-4" /> Đánh dấu đã đọc
                          </motion.button>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {!announcement.isRead && (
                        <motion.span 
                          initial={{ scale: 0.8 }}
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
                          className="inline-block h-3 w-3 bg-orange-500 rounded-full shadow-sm" 
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-8 text-center"
            >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <FiSearch className="h-6 w-6 text-gray-400" />
              </motion.div>
              <motion.p 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 text-gray-500"
              >
                {searchQuery ? 
                  'Không tìm thấy thông báo nào phù hợp với tìm kiếm của bạn.' : 
                  'Chưa có thông báo nào được gửi đến bạn.'}
              </motion.p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
} 