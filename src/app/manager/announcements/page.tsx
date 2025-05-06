'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiBell, FiSearch, FiPlus, FiEdit2, FiTrash2, FiFilter, 
  FiChevronLeft, FiChevronRight, FiX, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

type StatusType = 'published' | 'draft' | 'pending' | string;
type SortOrder = 'newest' | 'oldest' | string;

export default function ManagerAnnouncementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchDebounceTimeout, setSearchDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  
  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Announcements data
  const [announcements, setAnnouncements] = useState<{
    id: string;
    title: string;
    date: string;
    status: StatusType;
    audience: string;
    createdBy: string;
    priority: 'low' | 'medium' | 'high';
  }[]>([]);

  // Add animation styles for slide down effect and skeleton loading
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

        /* Skeleton loading animation */
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        .skeleton {
          background: linear-gradient(to right, #f0f0f0 8%, #e0e0e0 18%, #f0f0f0 33%);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite linear;
          border-radius: 4px;
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

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      // Check if user has permission to view announcements management
      if (session.user.role !== 'ADMIN' && session.user.role !== 'DEPARTMENT_HEAD') {
        toast.error('Bạn không có quyền truy cập trang này');
        router.push('/dashboard');
      }
    }
  }, [status, router, session]);

  // Handle search with debounce
  useEffect(() => {
    // Clear existing timeout
    if (searchDebounceTimeout) {
      clearTimeout(searchDebounceTimeout);
    }

    // Set a new timeout to debounce the search
    const timeout = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, 300);
    
    setSearchDebounceTimeout(timeout);

    // Cleanup function
    return () => {
      if (searchDebounceTimeout) {
        clearTimeout(searchDebounceTimeout);
      }
    };
  }, [searchTerm]);

  // Consolidated data fetching in a single useEffect to prevent multiple loads
  useEffect(() => {
    const fetchData = async () => {
      setFilterLoading(true);
      setLoading(true);
      
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('page', currentPage.toString());
        queryParams.append('limit', itemsPerPage.toString());
        
        if (searchTerm) {
          queryParams.append('search', searchTerm);
        }
        
        // Add sort order parameter for time-based sorting
        if (sortOrder === 'oldest') {
          queryParams.append('sort', 'createdAt:asc');
        } else {
          queryParams.append('sort', 'createdAt:desc'); // Default to newest first
        }
        
        // Only fetch announcements created by the current user
        if (session?.user?.id) {
          queryParams.append('createdBy', session.user.id);
        }
        
        const response = await fetch(`/api/announcements?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch announcements');
        }
        
        const data = await response.json();
        
        // Update state with real data
        setTotalItems(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
        
        // Map the API response to our expected format
        const mappedAnnouncements = data.announcements.map((item: {
          id: string;
          title: string;
          createdAt: string;
          isPublic: boolean;
          department?: { name: string };
          createdBy?: { name: string };
        }) => ({
          id: item.id,
          title: item.title,
          date: new Date(item.createdAt).toLocaleDateString('vi-VN'),
          status: item.isPublic ? 'published' : 'draft',
          audience: item.department?.name || 'Tất cả',
          createdBy: item.createdBy?.name || 'N/A',
          priority: getPriority(item.title, item.isPublic)
        }));
        
        setAnnouncements(mappedAnnouncements);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        toast.error('Đã xảy ra lỗi khi tải thông báo');
      } finally {
        setLoading(false);
        setFilterLoading(false);
      }
    };

    // Only fetch if user is authenticated
    if (status === 'authenticated') {
      fetchData();
    }
  }, [currentPage, itemsPerPage, searchTerm, sortOrder, session, status]);

  // Filter announcements based on search query and filter status
  // All filtering is now handled by the API
  const paginatedAnnouncements = announcements;

  const handleDeleteAnnouncement = (id: string) => {
    // Open delete confirmation modal
    setAnnouncementToDelete(id);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!announcementToDelete) return;
    
    try {
      const response = await fetch(`/api/announcements/${announcementToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }
      
      toast.success('Đã xóa thông báo thành công');
      // Instead of calling fetchAnnouncements, we'll trigger a re-fetch by updating one of the dependencies
      // of our main useEffect
      const currentSearchTerm = searchTerm;
      setSearchTerm('');
      setTimeout(() => setSearchTerm(currentSearchTerm), 10);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Đã xảy ra lỗi khi xóa thông báo');
    } finally {
      // Close modal and reset state
      setIsDeleteModalOpen(false);
      setAnnouncementToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setAnnouncementToDelete(null);
  };

  const handleSortOrderChange = (order: SortOrder) => {
    if (order !== sortOrder) {
      setSortOrder(order);
      setCurrentPage(1); // Reset to first page when changing sort order
    }
  };

  const clearFilters = () => {
    setSortOrder('newest');
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  // Map priority based on title or content
  const getPriority = (title: string, isPublic: boolean): 'low' | 'medium' | 'high' => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('quan trọng') || lowerTitle.includes('khẩn') || lowerTitle.includes('ngay lập tức')) {
      return 'high';
    }
    if (!isPublic) {
      return 'medium';
    }
    return 'low';
  };

  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage) return;
    setCurrentPage(newPage);
  };

  // Render skeleton loaders for table rows
  const renderSkeletonLoader = () => {
    return Array(itemsPerPage).fill(0).map((_, index) => (
      <tr key={`skeleton-${index}`} className="animate-pulse">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="h-5 skeleton w-3/4 mb-1"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="h-5 skeleton w-24"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="h-5 skeleton w-28"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right">
          <div className="flex space-x-2 justify-end">
            <div className="h-5 w-5 skeleton rounded-full"></div>
            <div className="h-5 w-5 skeleton rounded-full"></div>
            <div className="h-5 w-5 skeleton rounded-full"></div>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div className="space-y-6 relative pb-16 sm:pb-0">
      {/* Authentication loading state */}
      {status === 'loading' && (
        <div className="fixed inset-0 bg-white/80 flex flex-col items-center justify-center z-50">
          <div className="w-32 h-8 skeleton mb-4"></div>
          <div className="w-64 h-4 skeleton"></div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Xóa thông báo"
        message="Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác."
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
                placeholder="Tìm kiếm thông báo..."
                className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm cursor-text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{outline: 'none'}}
              />
              {searchTerm && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    style={{outline: 'none'}}
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-center whitespace-nowrap bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              style={{outline: 'none'}}
            >
              <FiFilter className="h-4 w-4 mr-1.5 text-gray-500" />
              <span>Bộ lọc</span>
              {sortOrder !== 'newest' && (
                <span className="ml-1.5 flex items-center justify-center bg-orange-500 text-white text-xs rounded-full w-5 h-5 font-medium">
                  1
                </span>
              )}
            </button>
            <Link href="/manager/announcements/create">
              <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors duration-200 cursor-pointer"
                style={{outline: 'none'}}
              >
                <FiPlus className="mr-2" /> Thêm thông báo
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
                placeholder="Tìm kiếm thông báo..."
                className="pl-10 pr-10 block w-full rounded-md border border-gray-300 bg-white py-2.5 px-3 text-gray-700 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{outline: 'none'}}
              />
              {searchTerm && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                    style={{outline: 'none'}}
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
              className="flex items-center justify-center w-full py-2.5 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              style={{outline: 'none'}}
            >
              <FiFilter className="h-4 w-4 mr-2 text-gray-500" />
              <span>Bộ lọc</span>
              {sortOrder !== 'newest' && (
                <span className="ml-1.5 flex items-center justify-center bg-orange-500 text-white text-xs rounded-full w-5 h-5 font-medium">
                  1
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active filters display */}
        {sortOrder !== 'newest' && (
          <div className="px-4 py-2 bg-gray-50 flex flex-wrap items-center gap-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 mr-0.5">Bộ lọc:</span>
            <div className="inline-flex items-center bg-orange-50 text-orange-700 rounded-full text-xs px-2.5 py-1">
              <span className="mr-1 font-medium">
                Sắp xếp: {sortOrder === 'oldest' ? 'Cũ nhất trước' : 'Mới nhất trước'}
              </span>
              <button 
                onClick={() => setSortOrder('newest')}
                className="text-orange-500 hover:text-orange-700 cursor-pointer"
                style={{outline: 'none'}}
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-gray-700 ml-auto cursor-pointer"
              style={{outline: 'none'}}
            >
              Xóa tất cả
            </button>
          </div>
        )}

        {/* Filter dropdown panel - always in the DOM, toggled with classes */}
        <div className={`border-gray-100 bg-gray-50 filter-panel ${isFilterOpen ? 'open border-b' : ''}`}>
          <div className="px-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Sắp xếp theo thời gian</label>
              <select
                value={sortOrder}
                onChange={(e) => handleSortOrderChange(e.target.value as SortOrder)}
                className="block w-full rounded-md border border-gray-300 py-2.5 px-3 bg-white text-gray-700 text-sm cursor-pointer"
                disabled={!isFilterOpen}
                style={{outline: 'none'}}
              >
                <option value="newest">Mới nhất trước</option>
                <option value="oldest">Cũ nhất trước</option>
              </select>
            </div>
            
            {/* Apply/Clear filters buttons */}
            <div className="flex items-center mt-4 gap-2">
              <button
                onClick={() => {
                  // Explicitly apply the current filter values
                  // Trigger a re-fetch by updating the current page temporarily
                  const current = currentPage;
                  setCurrentPage(0); 
                  setTimeout(() => setCurrentPage(current), 10);
                  setIsFilterOpen(false);
                }}
                className="flex-1 bg-orange-600 text-white rounded-md py-2.5 px-4 text-sm font-medium hover:bg-orange-700 cursor-pointer"
                style={{outline: 'none'}}
              >
                Áp dụng bộ lọc
              </button>
              {sortOrder !== 'newest' && (
                <button
                  onClick={clearFilters}
                  className="py-2.5 px-4 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  style={{outline: 'none'}}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Announcements table */}
      <div className="bg-white shadow rounded-lg overflow-hidden relative">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <FiBell className="mr-2 h-5 w-5 text-gray-500" />
            Danh sách thông báo
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiêu đề
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đối tượng
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Skeleton loading */}
              {loading && renderSkeletonLoader()}
              
              {!loading && paginatedAnnouncements.length > 0 ? (
                paginatedAnnouncements.map(announcement => (
                  <tr key={announcement.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{announcement.title}</div>
                        {announcement.priority === 'high' && (
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Quan trọng
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {announcement.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {announcement.audience}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2 justify-end">
                        <Link 
                          href={`/manager/announcements/${announcement.id}`}
                          className="text-blue-600 hover:text-blue-900 cursor-pointer" 
                          title="Xem chi tiết"
                          style={{outline: 'none'}}
                        >
                          <FiInfo className="w-5 h-5" />
                        </Link>
                        <Link 
                          href={`/manager/announcements/${announcement.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 cursor-pointer" 
                          title="Chỉnh sửa"
                          style={{outline: 'none'}}
                        >
                          <FiEdit2 className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                          title="Xóa"
                          style={{outline: 'none'}}
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    Không tìm thấy thông báo nào phù hợp với tìm kiếm của bạn.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination skeleton when loading */}
        {loading && (
          <div className="bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 sm:px-6">
            <div className="mb-4 sm:mb-0">
              <div className="h-5 skeleton w-64"></div>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="h-5 skeleton w-32 hidden sm:block"></div>
                <div className="h-9 skeleton w-16"></div>
              </div>
              
              <div className="inline-flex rounded-md shadow-sm -space-x-px">
                {Array(5).fill(0).map((_, i) => (
                  <div key={`skeleton-page-${i}`} className={`h-9 w-9 skeleton ${i === 0 || i === 4 ? 'rounded-md' : ''}`}></div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Actual pagination */}
        {!loading && paginatedAnnouncements.length > 0 && (
          <div className="bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 sm:px-6">
            <div className="mb-4 sm:mb-0">
              <p className="text-sm text-gray-700">
                Hiển thị{' '}
                <span className="font-medium">
                  {paginatedAnnouncements.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                </span>{' '}
                đến{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{' '}
                trong số <span className="font-medium">{totalItems}</span> kết quả
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <label htmlFor="itemsPerPage" className="text-sm text-gray-700 whitespace-nowrap hidden sm:inline">
                  Hiển thị mỗi trang
                </label>
                <select
                  id="itemsPerPage"
                  name="itemsPerPage"
                  className="block w-16 py-2 px-2 border border-gray-300 bg-white rounded-md shadow-sm text-sm"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  disabled={filterLoading}
                  style={{outline: 'none'}}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            
              <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  disabled={currentPage === 1 || filterLoading}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
                    currentPage === 1 || filterLoading
                      ? 'border-gray-300 bg-white text-gray-300 cursor-not-allowed'
                      : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 cursor-pointer'
                  }`}
                  style={{outline: 'none', cursor: currentPage === 1 || filterLoading ? 'not-allowed' : 'pointer'}}
                >
                  <span className="sr-only">Previous</span>
                  <FiChevronLeft className={`h-5 w-5 ${currentPage === 1 || filterLoading ? 'opacity-50' : ''}`} />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={filterLoading || currentPage === pageNum}
                      className={`relative inline-flex items-center px-4 py-2 border ${
                        currentPage === pageNum
                          ? 'z-10 border-orange-500 bg-orange-50 text-orange-600 cursor-default'
                          : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 cursor-pointer'
                      } ${filterLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                      style={{
                        outline: 'none', 
                        cursor: filterLoading 
                          ? 'not-allowed' 
                          : currentPage === pageNum 
                            ? 'default' 
                            : 'pointer'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  disabled={currentPage === totalPages || filterLoading}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${
                    currentPage === totalPages || filterLoading
                      ? 'border-gray-300 bg-white text-gray-300 cursor-not-allowed'
                      : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 cursor-pointer'
                  }`}
                  style={{outline: 'none', cursor: currentPage === totalPages || filterLoading ? 'not-allowed' : 'pointer'}}
                >
                  <span className="sr-only">Next</span>
                  <FiChevronRight className={`h-5 w-5 ${currentPage === totalPages || filterLoading ? 'opacity-50' : ''}`} />
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* FAB for adding announcements on mobile */}
      <div className="sm:hidden fixed bottom-6 right-6 z-10">
        <Link href="/manager/announcements/create">
          <button className="flex items-center justify-center w-14 h-14 rounded-full bg-orange-600 text-white shadow-lg hover:bg-orange-700 transition-colors duration-200"
            style={{outline: 'none'}}
          >
            <FiPlus className="h-6 w-6" />
          </button>
        </Link>
      </div>
    </div>
  );
} 