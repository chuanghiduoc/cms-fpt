'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight, 
  FiInfo, FiCalendar, FiMapPin, FiClock, FiFilter, FiX, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  department?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  participants?: {
    id: string;
    status: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
}

export default function DepartmentEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchDebounceTimeout, setSearchDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('');
  
  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  
  // Pagination state for upcoming events
  const [upcomingCurrentPage, setUpcomingCurrentPage] = useState(1);
  const [upcomingItemsPerPage, setUpcomingItemsPerPage] = useState(5);
  const [upcomingTotalItems, setUpcomingTotalItems] = useState(0);
  const [upcomingTotalPages, setUpcomingTotalPages] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  
  // Pagination state for past events
  const [pastCurrentPage, setPastCurrentPage] = useState(1);
  const [pastItemsPerPage, setPastItemsPerPage] = useState(5);
  const [pastTotalItems, setPastTotalItems] = useState(0);
  const [pastTotalPages, setPastTotalPages] = useState(0);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);

  // Add animation styles for slide down effect
  useEffect(() => {
    // Add the animation keyframes once to the document
    if (!document.getElementById('slide-down-animation')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'slide-down-animation';
      styleElement.textContent = `
        .filter-panel {
          max-height: 0;
          padding-top: 0;
          padding-bottom: 0;
          margin-top: 0;
          margin-bottom: 0;
          opacity: 0;
          overflow: hidden;
          border-width: 0;
          transition: max-height 0.3s ease-out, opacity 0.25s ease-out, padding 0.3s ease, margin 0.3s ease, border-width 0.3s ease;
        }
        
        .filter-panel.open {
          max-height: 500px;
          padding-top: 1rem;
          padding-bottom: 1rem;
          opacity: 1;
          border-width: 1px;
        }
      `;
      document.head.appendChild(styleElement);
    }
    
    return () => {
      // Clean up style element when component unmounts
      const styleElement = document.getElementById('slide-down-animation');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  useEffect(() => {
    // Only allow department heads to access this page
    if (status === 'authenticated') {
      if (session?.user?.role !== 'DEPARTMENT_HEAD') {
        router.push('/dashboard');
        toast.error('Bạn không có quyền truy cập trang này');
      } else {
        fetchEvents();
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', '1'); // Always fetch all events for splitting
      queryParams.append('limit', '1000'); // Use a large number to get all events
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      if (selectedStatus) {
        queryParams.append('status', selectedStatus);
      }
      
      if (selectedTimeframe) {
        queryParams.append('timeframe', selectedTimeframe);
      }
      
      const response = await fetch(`/api/events?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      
      // Split events into upcoming and past
      const now = new Date();
      const upcoming = data.events.filter((event: Event) => new Date(event.startDate) >= now)
        .sort((a: Event, b: Event) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      
      const past = data.events.filter((event: Event) => new Date(event.startDate) < now)
        .sort((a: Event, b: Event) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      
      // Set total counts for pagination
      setUpcomingTotalItems(upcoming.length);
      setUpcomingTotalPages(Math.ceil(upcoming.length / upcomingItemsPerPage));
      
      setPastTotalItems(past.length);
      setPastTotalPages(Math.ceil(past.length / pastItemsPerPage));
      
      // Apply pagination to each set
      const upcomingStart = (upcomingCurrentPage - 1) * upcomingItemsPerPage;
      const upcomingEnd = upcomingStart + upcomingItemsPerPage;
      setUpcomingEvents(upcoming.slice(upcomingStart, upcomingEnd));
      
      const pastStart = (pastCurrentPage - 1) * pastItemsPerPage;
      const pastEnd = pastStart + pastItemsPerPage;
      setPastEvents(past.slice(pastStart, pastEnd));
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Đã xảy ra lỗi khi tải sự kiện');
    } finally {
      setLoading(false);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    // Clear existing timeout
    if (searchDebounceTimeout) {
      clearTimeout(searchDebounceTimeout);
    }

    // Set a new timeout to debounce the search
    const timeout = setTimeout(() => {
      fetchEvents();
    }, 300);
    
    setSearchDebounceTimeout(timeout);

    // Cleanup function
    return () => {
      if (searchDebounceTimeout) {
        clearTimeout(searchDebounceTimeout);
      }
    };
  }, [searchTerm]);

  // Handle pagination and filter changes
  useEffect(() => {
    fetchEvents();
  }, [upcomingCurrentPage, upcomingItemsPerPage, pastCurrentPage, pastItemsPerPage, selectedStatus, selectedTimeframe]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteEvent = async (id: string) => {
    // Open delete confirmation modal
    setEventToDelete(id);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!eventToDelete) return;
    
    try {
      const response = await fetch(`/api/events/${eventToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      
      // Modal will show success toast
      fetchEvents(); // Refresh the list
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Đã xảy ra lỗi khi xóa sự kiện');
    } finally {
      // Close modal and reset state
      setIsDeleteModalOpen(false);
      setEventToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setEventToDelete(null);
  };

  const handleTimeframeFilterChange = (timeframe: string) => {
    if (timeframe !== selectedTimeframe) {
      setSelectedTimeframe(timeframe);
    }
  };

  const handleStatusFilterChange = (status: string) => {
    if (status !== selectedStatus) {
      setSelectedStatus(status);
    }
  };

  const clearFilters = () => {
    setSelectedStatus('');
    setSelectedTimeframe('');
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>, type: 'upcoming' | 'past') => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    
    if (type === 'upcoming') {
      setUpcomingItemsPerPage(newItemsPerPage);
      setUpcomingCurrentPage(1); // Reset to first page
    } else {
      setPastItemsPerPage(newItemsPerPage);
      setPastCurrentPage(1); // Reset to first page
    }
    
    fetchEvents(); // Refresh with new pagination
  };

  return (
    <div className="space-y-6 relative pb-16 sm:pb-0">
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Xóa sự kiện"
        message="Bạn có chắc chắn muốn xóa sự kiện này? Hành động này không thể hoàn tác."
      />
      
      {/* Search and filter section */}
      <div className="bg-white shadow rounded-lg mb-6">
        {/* Search bar + filter trigger for desktop */}
        <div className="p-4 border-b border-gray-100 hidden sm:block">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm sự kiện..."
                className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 focus:outline-none text-sm cursor-text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-gray-400 hover:text-gray-600 outline-none cursor-pointer"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-center whitespace-nowrap bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-700 hover:bg-gray-50 outline-none cursor-pointer"
            >
              <FiFilter className="h-4 w-4 mr-1.5 text-gray-500" />
              <span>Bộ lọc</span>
              {(selectedStatus || selectedTimeframe) && (
                <span className="ml-1.5 flex items-center justify-center bg-orange-500 text-white text-xs rounded-full w-5 h-5 font-medium">
                  {Number(!!selectedStatus) + Number(!!selectedTimeframe)}
                </span>
              )}
            </button>
            <Link href="/manager/events/create">
              <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 outline-none transition-colors duration-200 cursor-pointer">
                <FiPlus className="mr-2" /> Thêm sự kiện
              </button>
            </Link>
          </div>
        </div>
        
        {/* Mobile optimized search & utility bar */}
        <div className="sm:hidden">
          {/* Search section */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm sự kiện..."
                className="pl-10 pr-10 block w-full rounded-md border border-gray-300 bg-white py-2.5 px-3 text-gray-700 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-gray-400 hover:text-gray-600 outline-none cursor-pointer p-1"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Filter button only on mobile */}
          <div className="p-3 border-b border-gray-100">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-center w-full py-2.5 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 outline-none transition-colors"
            >
              <FiFilter className="h-4 w-4 mr-2 text-gray-500" />
              <span>Bộ lọc</span>
              {(selectedStatus || selectedTimeframe) && (
                <span className="ml-1.5 flex items-center justify-center bg-orange-500 text-white text-xs rounded-full w-5 h-5 font-medium">
                  {Number(!!selectedStatus) + Number(!!selectedTimeframe)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active filters display */}
        {(selectedStatus || selectedTimeframe) && (
          <div className="px-4 py-2 bg-gray-50 flex flex-wrap items-center gap-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 mr-0.5">Bộ lọc:</span>
            {selectedStatus && (
              <div className="inline-flex items-center bg-orange-50 text-orange-700 rounded-full text-xs px-2.5 py-1">
                <span className="mr-1 font-medium">
                  Trạng thái: {selectedStatus === 'true' ? 'Công khai' : 'Nội bộ'}
                </span>
                <button 
                  onClick={() => handleStatusFilterChange('')}
                  className="text-orange-500 hover:text-orange-700 outline-none cursor-pointer"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {selectedTimeframe && (
              <div className="inline-flex items-center bg-blue-50 text-blue-700 rounded-full text-xs px-2.5 py-1">
                <span className="mr-1 font-medium">
                  Thời gian: {
                    selectedTimeframe === 'today' ? 'Hôm nay' :
                    selectedTimeframe === 'upcoming' ? 'Sắp tới' :
                    selectedTimeframe === 'past' ? 'Đã qua' : selectedTimeframe
                  }
                </span>
                <button 
                  onClick={() => handleTimeframeFilterChange('')}
                  className="text-blue-500 hover:text-blue-700 outline-none cursor-pointer"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-gray-700 ml-auto outline-none cursor-pointer"
            >
              Xóa tất cả
            </button>
          </div>
        )}

        {/* Filter dropdown panel - always in the DOM, toggled with classes */}
        <div className={`border-gray-100 bg-gray-50 filter-panel ${isFilterOpen ? 'open border-b' : ''}`}>
          <div className="px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Trạng thái</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2.5 px-3 bg-white text-gray-700 text-sm outline-none cursor-pointer"
                  disabled={!isFilterOpen}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="true">Công khai</option>
                  <option value="false">Nội bộ</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Thời gian</label>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => handleTimeframeFilterChange(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2.5 px-3 bg-white text-gray-700 text-sm outline-none cursor-pointer"
                  disabled={!isFilterOpen}
                >
                  <option value="">Tất cả thời gian</option>
                  <option value="today">Hôm nay</option>
                  <option value="upcoming">Sắp tới</option>
                  <option value="past">Đã qua</option>
                </select>
              </div>
            </div>
            
            {/* Apply/Clear filters buttons */}
            <div className="flex items-center mt-4 gap-2">
              <button
                onClick={() => {
                  // Explicitly apply the current filter values
                  fetchEvents(); // Re-fetch with current filters
                  setIsFilterOpen(false);
                }}
                className="flex-1 bg-orange-600 text-white rounded-md py-2.5 px-4 text-sm font-medium hover:bg-orange-700 outline-none cursor-pointer"
              >
                Áp dụng bộ lọc
              </button>
              {(selectedStatus || selectedTimeframe) && (
                <button
                  onClick={clearFilters}
                  className="py-2.5 px-4 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 outline-none cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Upcoming Events */}
      <div className="bg-white shadow rounded-lg overflow-hidden relative mb-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <FiCalendar className="mr-2 text-orange-500" /> Sự kiện sắp diễn ra
          </h2>
        </div>
        
        {loading ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sự kiện
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Địa điểm
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người tham gia
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, index) => (
                  <tr key={`skeleton-upcoming-${index}`} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-200 rounded-full"></div>
                        <div className="ml-4 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-48"></div>
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex -space-x-2 overflow-hidden">
                        <div className="inline-flex h-8 w-8 rounded-full bg-gray-200"></div>
                        <div className="inline-flex h-8 w-8 rounded-full bg-gray-200"></div>
                        <div className="inline-flex h-8 w-8 rounded-full bg-gray-200"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex space-x-2 justify-end">
                        <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                        <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                        <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sự kiện
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Địa điểm
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người tham gia
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-orange-100 rounded-full">
                          <FiCalendar className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{event.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <FiClock className="mr-1 text-gray-400" /> {formatDate(event.startDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(event.startDate)} - {formatTime(event.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <FiMapPin className="mr-1 text-gray-400" /> {event.location || 'Chưa có địa điểm'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex -space-x-2 overflow-hidden">
                        {event.participants && event.participants.length > 0 ? (
                          <>
                            {event.participants.slice(0, 3).map((participant, idx) => (
                              <div key={idx} className="inline-flex h-8 w-8 rounded-full border-2 border-white bg-gray-200 items-center justify-center" title={participant.user.name}>
                                <span className="text-xs font-medium">
                                  {participant.user.name.split(' ').pop()?.charAt(0) || '?'}
                                </span>
                              </div>
                            ))}
                            {event.participants.length > 3 && (
                              <div className="inline-flex h-8 w-8 rounded-full border-2 border-white bg-gray-200 items-center justify-center">
                                <span className="text-xs font-medium">+{event.participants.length - 3}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center text-sm text-gray-500">
                            <FiUser className="mr-1" /> Chưa có người tham gia
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${event.isPublic ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {event.isPublic ? 'Công khai' : 'Nội bộ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <div className="flex space-x-2 justify-end">
                        <Link 
                          href={`/manager/events/${event.id}`}
                          className="text-blue-600 hover:text-blue-900 cursor-pointer" 
                          title="Xem chi tiết"
                        >
                          <FiInfo className="w-5 h-5" />
                        </Link>
                        <Link 
                          href={`/manager/events/edit/${event.id}`}
                          className="text-indigo-600 hover:text-indigo-900 cursor-pointer" 
                          title="Chỉnh sửa"
                        >
                          <FiEdit2 className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                          title="Xóa"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Không có sự kiện sắp diễn ra.
          </div>
        )}
        
        {/* Pagination for upcoming events */}
        {!loading && upcomingTotalItems > 0 && (
          <div className="bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 sm:px-6">
            <div className="mb-4 sm:mb-0">
              <p className="text-sm text-gray-700">
                Hiển thị{' '}
                <span className="font-medium">
                  {upcomingEvents.length > 0 ? (upcomingCurrentPage - 1) * upcomingItemsPerPage + 1 : 0}
                </span>{' '}
                đến{' '}
                <span className="font-medium">
                  {Math.min(upcomingCurrentPage * upcomingItemsPerPage, upcomingTotalItems)}
                </span>{' '}
                trong số <span className="font-medium">{upcomingTotalItems}</span> kết quả
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <label htmlFor="upcomingItemsPerPage" className="text-sm text-gray-700 whitespace-nowrap hidden sm:inline">
                  Hiển thị mỗi trang
                </label>
                <select
                  id="upcomingItemsPerPage"
                  name="upcomingItemsPerPage"
                  className="block w-16 py-2 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none text-sm"
                  value={upcomingItemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e, 'upcoming')}
                  disabled={loading}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            
              <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  disabled={upcomingCurrentPage === 1 || loading}
                  onClick={() => setUpcomingCurrentPage(Math.max(1, upcomingCurrentPage - 1))}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    upcomingCurrentPage === 1 || loading
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                
                {Array.from({ length: Math.min(5, upcomingTotalPages) }, (_, i) => {
                  let pageNum;
                  
                  if (upcomingTotalPages <= 5) {
                    pageNum = i + 1;
                  } else if (upcomingCurrentPage <= 3) {
                    pageNum = i + 1;
                  } else if (upcomingCurrentPage >= upcomingTotalPages - 2) {
                    pageNum = upcomingTotalPages - 4 + i;
                  } else {
                    pageNum = upcomingCurrentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setUpcomingCurrentPage(pageNum)}
                      disabled={loading}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        upcomingCurrentPage === pageNum
                          ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  disabled={upcomingCurrentPage === upcomingTotalPages || loading}
                  onClick={() => setUpcomingCurrentPage(Math.min(upcomingTotalPages, upcomingCurrentPage + 1))}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    upcomingCurrentPage === upcomingTotalPages || loading
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <FiChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
      
      {/* Past Events */}
      <div className="bg-white shadow rounded-lg overflow-hidden relative">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <FiCalendar className="mr-2 text-gray-500" /> Sự kiện đã diễn ra
          </h2>
        </div>
        
        {loading ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sự kiện
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Địa điểm
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người tham gia
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, index) => (
                  <tr key={`skeleton-past-${index}`} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-200 rounded-full"></div>
                        <div className="ml-4 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-48"></div>
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex -space-x-2 overflow-hidden">
                        <div className="inline-flex h-8 w-8 rounded-full bg-gray-200"></div>
                        <div className="inline-flex h-8 w-8 rounded-full bg-gray-200"></div>
                        <div className="inline-flex h-8 w-8 rounded-full bg-gray-200"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex space-x-2 justify-end">
                        <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                        <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : pastEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sự kiện
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Địa điểm
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người tham gia
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pastEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-full">
                          <FiCalendar className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{event.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <FiClock className="mr-1 text-gray-400" /> {formatDate(event.startDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(event.startDate)} - {formatTime(event.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <FiMapPin className="mr-1 text-gray-400" /> {event.location || 'Chưa có địa điểm'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex -space-x-2 overflow-hidden">
                        {event.participants && event.participants.length > 0 ? (
                          <>
                            {event.participants.slice(0, 3).map((participant, idx) => (
                              <div key={idx} className="inline-flex h-8 w-8 rounded-full border-2 border-white bg-gray-200 items-center justify-center" title={participant.user.name}>
                                <span className="text-xs font-medium">
                                  {participant.user.name.split(' ').pop()?.charAt(0) || '?'}
                                </span>
                              </div>
                            ))}
                            {event.participants.length > 3 && (
                              <div className="inline-flex h-8 w-8 rounded-full border-2 border-white bg-gray-200 items-center justify-center">
                                <span className="text-xs font-medium">+{event.participants.length - 3}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center text-sm text-gray-500">
                            <FiUser className="mr-1" /> Chưa có người tham gia
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${event.isPublic ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {event.isPublic ? 'Công khai' : 'Nội bộ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <div className="flex space-x-2 justify-end">
                        <Link 
                          href={`/manager/events/${event.id}`}
                          className="text-blue-600 hover:text-blue-900 cursor-pointer" 
                          title="Xem chi tiết"
                        >
                          <FiInfo className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                          title="Xóa"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Không có sự kiện đã diễn ra.
          </div>
        )}
        
        {/* Pagination for past events */}
        {!loading && pastTotalItems > 0 && (
          <div className="bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 sm:px-6">
            <div className="mb-4 sm:mb-0">
              <p className="text-sm text-gray-700">
                Hiển thị{' '}
                <span className="font-medium">
                  {pastEvents.length > 0 ? (pastCurrentPage - 1) * pastItemsPerPage + 1 : 0}
                </span>{' '}
                đến{' '}
                <span className="font-medium">
                  {Math.min(pastCurrentPage * pastItemsPerPage, pastTotalItems)}
                </span>{' '}
                trong số <span className="font-medium">{pastTotalItems}</span> kết quả
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <label htmlFor="pastItemsPerPage" className="text-sm text-gray-700 whitespace-nowrap hidden sm:inline">
                  Hiển thị mỗi trang
                </label>
                <select
                  id="pastItemsPerPage"
                  name="pastItemsPerPage"
                  className="block w-16 py-2 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none text-sm"
                  value={pastItemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e, 'past')}
                  disabled={loading}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            
              <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  disabled={pastCurrentPage === 1 || loading}
                  onClick={() => setPastCurrentPage(Math.max(1, pastCurrentPage - 1))}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    pastCurrentPage === 1 || loading
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                
                {Array.from({ length: Math.min(5, pastTotalPages) }, (_, i) => {
                  let pageNum;
                  
                  if (pastTotalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pastCurrentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pastCurrentPage >= pastTotalPages - 2) {
                    pageNum = pastTotalPages - 4 + i;
                  } else {
                    pageNum = pastCurrentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPastCurrentPage(pageNum)}
                      disabled={loading}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pastCurrentPage === pageNum
                          ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  disabled={pastCurrentPage === pastTotalPages || loading}
                  onClick={() => setPastCurrentPage(Math.min(pastTotalPages, pastCurrentPage + 1))}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    pastCurrentPage === pastTotalPages || loading
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <FiChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* FAB for adding events on mobile */}
      <div className="sm:hidden fixed bottom-6 right-6 z-10">
        <Link href="/manager/events/create">
          <button className="flex items-center justify-center w-14 h-14 rounded-full bg-orange-600 text-white shadow-lg hover:bg-orange-700 outline-none transition-colors duration-200">
            <FiPlus className="h-6 w-6" />
          </button>
        </Link>
      </div>
    </div>
  );
} 