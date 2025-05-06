import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export interface Notification {
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

interface UseNotificationsOptions {
  limit?: number;
  refreshInterval?: number | null;
  includeRead?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { data: session } = useSession();

  const { 
    limit = 5, 
    refreshInterval = 60000, // Default refresh every minute
    includeRead = true 
  } = options;

  const fetchNotifications = useCallback(async (showLoading = true) => {
    if (!session?.user) return;
    
    try {
      if (showLoading) setLoading(true);
      const response = await fetch(
        `/api/announcements?limit=${limit}&includeRead=${includeRead}&sort=createdAt:desc`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      
      // Process notifications to include isRead flag
      const processedNotifications = data.announcements.map((notification: Notification) => ({
        ...notification,
        isRead: notification.readByUsers?.some(
          (user: { id: string }) => user.id === session?.user?.id
        ) || false,
      }));
      
      setNotifications(processedNotifications);
      
      // Count unread notifications
      const unreadNotifications = processedNotifications.filter(
        (notification: Notification) => !notification.isRead
      );
      setUnreadCount(unreadNotifications.length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [session, limit, includeRead]);

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      // Optimistically update UI immediately
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Then send request to server
      const response = await fetch(`/api/announcements/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        // Revert changes if server request failed
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: false } 
              : notification
          )
        );
        setUnreadCount(prev => prev + 1);
        
        toast.error(data.message || 'Không thể đánh dấu đã đọc');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      // Revert changes if request failed
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: false } 
            : notification
        )
      );
      setUnreadCount(prev => prev + 1);
      
      toast.error('Đã xảy ra lỗi');
      return false;
    }
  };

  // Fetch notifications on mount and when dependencies change
  useEffect(() => {
    fetchNotifications();
    
    // Set up interval for refreshing if needed
    let intervalId: NodeJS.Timeout | undefined;
    
    if (refreshInterval) {
      intervalId = setInterval(() => {
        // Use silent fetching for interval updates
        fetchNotifications(false);
      }, refreshInterval);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [session, fetchNotifications, refreshInterval]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
  };
} 