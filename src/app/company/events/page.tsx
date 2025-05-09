'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiFilter, FiSearch, FiCheck, FiX, FiClock as FiClockIcon, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  createdBy: {
    name: string;
  };
  department?: {
    name: string;
  };
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  isRequired?: boolean;
  _count?: {
    participants: number;
  };
  participants?: Array<{
    status: string;
    userId: string;
  }>;
  confirmationStatus?: 'CONFIRMED' | 'DECLINED' | 'PENDING';
}

export default function EmployeeEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter states
  const [confirmationFilter, setConfirmationFilter] = useState<string>('all');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [tabChanging, setTabChanging] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const filterButtonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchEvents();
    }
  }, [status, session, router, activeTab, confirmationFilter, searchTerm, currentPage]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Build query string with filters
      const queryParams = new URLSearchParams();
      
      // Use the active tab to determine timeframe
      queryParams.append('timeframe', activeTab);
      
      if (confirmationFilter !== 'all') {
        queryParams.append('participation', confirmationFilter.toLowerCase());
      }
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', itemsPerPage.toString());
      queryParams.append('sort', 'startDate');
      queryParams.append('order', activeTab === 'upcoming' ? 'asc' : 'desc');
      
      // For debugging - log the full URL
      console.log('Fetching events with URL:', `/api/events?${queryParams.toString()}`);
      
      // Fetch events from API
      const response = await fetch(`/api/events?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      
      // Process events to determine status and confirmation status
      const processedEvents = data.events.map((event: Event) => {
        // Determine event status
        const now = new Date();
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        
        let eventStatus = 'UPCOMING';
        if (now >= startDate && now <= endDate) {
          eventStatus = 'ONGOING';
        } else if (now > endDate) {
          eventStatus = 'COMPLETED';
        }
        
        // Find user's confirmation status
        let confirmationStatus = 'PENDING';
        if (event.participants && session?.user?.id) {
          const userParticipation = event.participants.find(
            (p: { userId: string; status: string }) => p.userId === session.user.id
          );
          
          if (userParticipation) {
            // Convert status from lowercase in DB to uppercase for UI consistency
            confirmationStatus = userParticipation.status.toUpperCase();
          }
        }
        
        return {
          ...event,
          status: eventStatus,
          confirmationStatus,
        };
      });
      
      setEvents(processedEvents);
      setTotalItems(data.pagination?.total || processedEvents.length);
    } catch (error) {
      console.error('Lỗi khi tải sự kiện:', error);
      toast.error('Đã xảy ra lỗi khi tải danh sách sự kiện');
    } finally {
      setLoading(false);
      setTabChanging(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-100 text-blue-800';
      case 'ONGOING':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'Sắp diễn ra';
      case 'ONGOING':
        return 'Đang diễn ra';
      case 'COMPLETED':
        return 'Đã kết thúc';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getConfirmationStatusClass = (status?: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'text-green-600';
      case 'DECLINED':
        return 'text-red-600';
      case 'PENDING':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getConfirmationIcon = (status?: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <FiCheck className="mr-1" />;
      case 'DECLINED':
        return <FiX className="mr-1" />;
      default:
        return <FiClockIcon className="mr-1" />;
    }
  };

  const getConfirmationLabel = (status?: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'DECLINED':
        return 'Đã từ chối';
      case 'PENDING':
        return 'Chưa phản hồi';
      default:
        return 'Không xác định';
    }
  };

  const handleConfirmEvent = async (eventId: string, status: 'CONFIRMED' | 'DECLINED') => {
    try {
      const response = await fetch(`/api/events/${eventId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: status.toLowerCase() }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update participation status');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update UI optimistically
        setEvents(prevEvents => prevEvents.map(event => 
          event.id === eventId ? { ...event, confirmationStatus: status } : event
        ));
        
        toast.success(status === 'CONFIRMED' ? 'Đã xác nhận tham gia sự kiện' : 'Đã từ chối tham gia sự kiện');
      } else {
        throw new Error(data.message || 'Failed to update participation status');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái tham gia:', error);
      toast.error('Đã xảy ra lỗi khi cập nhật trạng thái tham gia');
      fetchEvents(); // Reload to get correct state
    }
  };

  const handleTabChange = (tab: 'upcoming' | 'past') => {
    if (activeTab !== tab) {
      setTabChanging(true);
      setEvents([]); // Clear events to prevent UI flicker
      setActiveTab(tab);
      setCurrentPage(1);
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (status === 'loading') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 relative pb-16 sm:pb-6"
      >
        {/* Search and Filters Skeleton */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Events List Skeleton */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-5">
                <div className="flex flex-col md:flex-row md:gap-4 justify-between">
                  <div className="flex-1">
                    <div className="flex items-start">
                      <div className="mr-4 flex-shrink-0">
                        <div className="h-14 w-14 bg-gray-200 rounded-lg animate-pulse"></div>
                      </div>
                      <div className="flex-1">
                        <div className="h-6 w-3/4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                        <div className="h-4 w-full bg-gray-200 rounded mb-2 animate-pulse"></div>
                        <div className="h-4 w-full bg-gray-200 rounded mb-3 animate-pulse"></div>
                        <div className="flex flex-wrap gap-3">
                          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 w-36 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end py-1">
                    <div className="h-6 w-24 bg-gray-200 rounded-full mb-3 animate-pulse"></div>
                    <div className="h-5 w-32 bg-gray-200 rounded mb-3 animate-pulse"></div>
                    <div className="flex gap-2">
                      <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 relative pb-16 sm:pb-6"
    >
      {/* Search and filters */}
      <motion.div 
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="bg-white shadow-md rounded-lg overflow-hidden"
      >
        {/* Search bar */}
        <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm sự kiện..."
                className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        
        {/* Filter section */}
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="flex flex-col space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center text-sm font-medium text-gray-700">
                <FiFilter className="h-4 w-4 text-orange-500 mr-1.5" />
                Trạng thái tham gia:
              </span>
              <div className="flex flex-wrap gap-2">
                <motion.button
                  variants={filterButtonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => {
                    setConfirmationFilter('all');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    confirmationFilter === 'all'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Tất cả
                </motion.button>
                <motion.button
                  variants={filterButtonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => {
                    setConfirmationFilter('confirmed');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    confirmationFilter === 'confirmed'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Đã xác nhận
                </motion.button>
                <motion.button
                  variants={filterButtonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => {
                    setConfirmationFilter('pending');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    confirmationFilter === 'pending'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Chưa phản hồi
                </motion.button>
                <motion.button
                  variants={filterButtonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => {
                    setConfirmationFilter('declined');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    confirmationFilter === 'declined'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Đã từ chối
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Events list */}
      <motion.div 
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="bg-white shadow-md rounded-lg overflow-hidden"
      >
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <motion.button
              whileHover={{ backgroundColor: activeTab === 'upcoming' ? undefined : 'rgba(249, 250, 251, 0.5)' }}
              onClick={() => handleTabChange('upcoming')}
              className={`relative min-w-0 flex-1 overflow-hidden py-4 px-4 text-center text-sm font-medium focus:z-10 focus:outline-none ${
                activeTab === 'upcoming'
                  ? 'text-orange-600 border-b-2 border-orange-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sắp diễn ra
            </motion.button>
            <motion.button
              whileHover={{ backgroundColor: activeTab === 'past' ? undefined : 'rgba(249, 250, 251, 0.5)' }}
              onClick={() => handleTabChange('past')}
              className={`relative min-w-0 flex-1 overflow-hidden py-4 px-4 text-center text-sm font-medium focus:z-10 focus:outline-none ${
                activeTab === 'past'
                  ? 'text-orange-600 border-b-2 border-orange-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Đã diễn ra
            </motion.button>
          </div>
        </div>
        
        {/* Events Summary - Fixed height to prevent layout shift */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white min-h-[60px] flex items-center">
          {loading || tabChanging ? (
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-full">
                <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
              <div className="h-6 w-48 bg-gray-200 rounded ml-3 animate-pulse"></div>
            </div>
          ) : (
            <div className="flex items-center">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 10 }}
                className="p-2 bg-orange-50 rounded-full"
              >
                <FiCalendar className="h-5 w-5 text-orange-500" />
              </motion.div>
              <h2 className="text-lg font-medium text-gray-800 ml-3">
                {`${totalItems} sự kiện ${
                  activeTab === 'upcoming' ? 'sắp diễn ra' : 'đã diễn ra'
                }${searchTerm ? ` với từ khóa "${searchTerm}"` : ''}`}
              </h2>
            </div>
          )}
        </div>
        
        {loading || tabChanging ? (
          <div className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-5">
                <div className="flex flex-col md:flex-row md:gap-4 justify-between">
                  <div className="flex-1">
                    <div className="flex items-start">
                      <div className="mr-4 flex-shrink-0">
                        <div className="h-14 w-14 bg-gray-200 rounded-lg animate-pulse"></div>
                      </div>
                      <div className="flex-1">
                        <div className="h-6 w-3/4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                        <div className="h-4 w-full bg-gray-200 rounded mb-2 animate-pulse"></div>
                        <div className="h-4 w-full bg-gray-200 rounded mb-3 animate-pulse"></div>
                        <div className="flex flex-wrap gap-3">
                          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 w-36 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end py-1">
                    <div className="h-6 w-24 bg-gray-200 rounded-full mb-3 animate-pulse"></div>
                    <div className="h-5 w-32 bg-gray-200 rounded mb-3 animate-pulse"></div>
                    <div className="flex gap-2">
                      <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-gray-200"
          >
            {events.map((event) => (
              <motion.div 
                key={event.id} 
                variants={itemVariants}
                whileHover={{ backgroundColor: 'rgba(249, 250, 251, 1)' }}
                className="transition-colors duration-150"
              >
                <div className="p-5">
                  <div className="flex flex-col md:flex-row md:gap-4 justify-between">
                    <div className="flex-1">
                      <div className="flex items-start">
                        <motion.div 
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="mr-4 flex-shrink-0"
                        >
                          <div className="h-14 w-14 flex items-center justify-center bg-orange-50 text-orange-500 rounded-lg">
                            <FiCalendar className="h-7 w-7" />
                          </div>
                        </motion.div>
                        <div>
                          <motion.h3 
                            whileHover={{ color: '#f97316' }}
                            className="text-lg font-semibold text-gray-900 mb-1 transition-colors"
                          >
                            <Link href={`/company/events/${event.id}`}>
                              {event.title}
                            </Link>
                          </motion.h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                          <div className="flex flex-wrap items-center text-sm text-gray-500 gap-3">
                            <div className="flex items-center">
                              <FiClock className="mr-1.5 h-4 w-4 text-gray-400" />
                              <span>{formatDate(event.startDate)}, {formatTime(event.startDate)} - {formatTime(event.endDate)}</span>
                            </div>
                            <div className="flex items-center">
                              <FiMapPin className="mr-1.5 h-4 w-4 text-gray-400" />
                              <span>{event.location}</span>
                            </div>
                            <div className="flex items-center">
                              <FiUsers className="mr-1.5 h-4 w-4 text-gray-400" />
                              <span>{event._count?.participants || 0} người tham gia</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex flex-col justify-between items-start md:items-end py-1">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <motion.span 
                          whileHover={{ scale: 1.05 }}
                          className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(event.status)}`}
                        >
                          {getStatusLabel(event.status)}
                        </motion.span>
                        {event.isRequired && (
                          <motion.span 
                            whileHover={{ scale: 1.05 }}
                            className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800"
                          >
                            Bắt buộc
                          </motion.span>
                        )}
                      </div>
                      
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className={`flex items-center mb-3 ${getConfirmationStatusClass(event.confirmationStatus)}`}
                      >
                        {getConfirmationIcon(event.confirmationStatus)}
                        <span>{getConfirmationLabel(event.confirmationStatus)}</span>
                      </motion.div>
                      
                      {/* Action buttons for upcoming events */}
                      {event.status === 'UPCOMING' && (
                        <div className="flex gap-2">
                          {event.confirmationStatus !== 'CONFIRMED' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleConfirmEvent(event.id, 'CONFIRMED')}
                              className="px-3.5 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium hover:bg-green-100 transition-colors duration-200 focus:outline-none flex items-center shadow-sm"
                            >
                              <FiCheck className="mr-1.5 h-4 w-4" /> Tham gia
                            </motion.button>
                          )}
                          
                          {event.confirmationStatus !== 'DECLINED' && !event.isRequired && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleConfirmEvent(event.id, 'DECLINED')}
                              className="px-3.5 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium hover:bg-red-100 transition-colors duration-200 focus:outline-none flex items-center shadow-sm"
                            >
                              <FiX className="mr-1.5 h-4 w-4" /> Từ chối
                            </motion.button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4"
            >
              <FiCalendar className="h-10 w-10 text-gray-400" />
            </motion.div>
            <p className="text-gray-500 mb-6 text-center max-w-md">
              {(confirmationFilter !== 'all' || searchTerm) ? 
                'Không tìm thấy sự kiện nào phù hợp với bộ lọc hiện tại.' : 
                `Không có sự kiện ${activeTab === 'upcoming' ? 'sắp diễn ra' : 'đã diễn ra'} nào được tìm thấy.`}
            </p>
          </motion.div>
        )}
      </motion.div>
      
      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mt-6"
        >
          <nav className="flex items-center" aria-label="Pagination">
            <motion.button
              whileHover={{ scale: currentPage !== 1 ? 1.1 : 1 }}
              whileTap={{ scale: currentPage !== 1 ? 0.9 : 1 }}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-3 py-2 rounded-l-md border ${
                currentPage === 1
                  ? 'text-gray-300 bg-white border-gray-300 cursor-not-allowed'
                  : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <span className="sr-only">Trang trước</span>
              <FiChevronLeft className="h-5 w-5" />
            </motion.button>
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              // For many pages, show first, last, current, and pages around current
              let pageToShow = i + 1;
              if (totalPages > 5) {
                if (currentPage <= 3) {
                  pageToShow = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageToShow = totalPages - 4 + i;
                } else {
                  pageToShow = currentPage - 2 + i;
                }
              }
              
              // Show ellipsis if needed
              if (
                totalPages > 5 && (
                (pageToShow === 2 && currentPage > 3) || 
                (pageToShow === totalPages - 1 && currentPage < totalPages - 2)
              )) {
                return (
                  <span
                    key={`ellipsis-${pageToShow}`}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    ...
                  </span>
                );
              }
              
              return (
                <motion.button
                  key={pageToShow}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentPage(pageToShow)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    pageToShow === currentPage
                      ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageToShow}
                </motion.button>
              );
            })}
            
            <motion.button
              whileHover={{ scale: currentPage !== totalPages ? 1.1 : 1 }}
              whileTap={{ scale: currentPage !== totalPages ? 0.9 : 1 }}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-3 py-2 rounded-r-md border ${
                currentPage === totalPages
                  ? 'text-gray-300 bg-white border-gray-300 cursor-not-allowed'
                  : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <span className="sr-only">Trang sau</span>
              <FiChevronRight className="h-5 w-5" />
            </motion.button>
          </nav>
        </motion.div>
      )}
    </motion.div>
  );
} 