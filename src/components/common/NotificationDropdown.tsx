'use client';

import { useState, useRef, useEffect } from 'react';
import { FiBell, FiChevronRight, FiX } from 'react-icons/fi';
import Link from 'next/link';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, Notification } from '@/hooks/useNotifications';

interface NotificationDropdownProps {
  limit?: number;
}

export default function NotificationDropdown({ limit = 5 }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead
  } = useNotifications({ limit, includeRead: true });

  // Format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy');
  };

  // Handle marking notification as read
  const handleMarkAsRead = async (notificationId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    await markAsRead(notificationId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Animation variants
  const dropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    },
    exit: { 
      opacity: 0,
      y: -10,
      transition: { 
        duration: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring',
        stiffness: 500,
        damping: 30
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative focus:outline-none"
        aria-label="Notifications"
      >
        <FiBell className="h-6 w-6 text-gray-500 hover:text-orange-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="p-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-900">Thông báo ({unreadCount} chưa đọc)</h3>
              <Link href="/company/announcements" onClick={() => setIsOpen(false)} className="text-xs text-orange-600 hover:text-orange-800">
                Xem tất cả
              </Link>
            </div>
            
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="flex justify-center">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Không có thông báo nào
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <ul className="divide-y divide-gray-100">
                  {notifications.map((notification: Notification, index: number) => (
                    <motion.li 
                      key={notification.id}
                      className="hover:bg-gray-50"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link 
                        href={`/company/announcements/${notification.id}`}
                        onClick={() => setIsOpen(false)}
                        className="block"
                      >
                        <div className="px-4 py-3">
                          <div className="flex justify-between">
                            <div className="flex items-center">
                              {!notification.isRead && (
                                <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                              )}
                              <p className={`text-sm font-medium ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                                {notification.title}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500">{formatDate(notification.createdAt)}</p>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 line-clamp-1">{notification.content}</p>
                          <div className="mt-1 flex justify-between">
                            <span className="inline-flex items-center text-xs font-medium text-orange-600 hover:text-orange-800">
                              Đọc tiếp <FiChevronRight className="ml-1 h-3 w-3" />
                            </span>
                            <button 
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                              style={{ visibility: notification.isRead ? 'hidden' : 'visible' }}
                            >
                              Đánh dấu đã đọc
                            </button>
                          </div>
                        </div>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="p-2 border-t border-gray-200 flex justify-end">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
              >
                <FiX className="mr-1 h-3 w-3" /> Đóng
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 