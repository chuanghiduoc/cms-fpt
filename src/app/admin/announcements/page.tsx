'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiBell, FiSearch, FiPlus, FiEdit2, FiTrash2, 
  FiChevronLeft, FiChevronRight, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

type StatusType = 'published' | 'draft' | 'pending' | string;
type SortOrder = 'newest' | 'oldest' | string;

export default function AdminAnnouncementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [searchDebounceTimeout, setSearchDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(false);
  
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
  }[]>([]);

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

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      // Check if user has permission to view system announcements management
      if (session.user.role !== 'ADMIN') {
        toast.error('Bạn không có quyền truy cập trang này');
        router.push('/dashboard');
      } else {
        // Initial fetch only when component mounts and user is authenticated
        fetchAnnouncements();
      }
    }
  }, [status, router, session]);

  // Combined effect for search, pagination, and sorting
  useEffect(() => {
    // Only fetch if we've already loaded data once (to avoid double fetch on initial load)
    // or if any of the parameters have changed from their initial values
    if (announcements.length !== 0 || 
        searchTerm !== '' || 
        currentPage !== 1 || 
        sortOrder !== 'newest') {
      
      // Clear existing timeout for search debounce
      if (searchDebounceTimeout) {
        clearTimeout(searchDebounceTimeout);
      }
      
      // Debounce all parameter changes
      const timeout = setTimeout(() => {
        fetchAnnouncements();
      }, 300);
      
      setSearchDebounceTimeout(timeout);
    }
    
    return () => {
      if (searchDebounceTimeout) {
        clearTimeout(searchDebounceTimeout);
      }
    };
  }, [searchTerm, currentPage, itemsPerPage, sortOrder]);

  // This would be an API call in a real application
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', itemsPerPage.toString());
      queryParams.append('isSystem', 'true'); // Only fetch system announcements
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      // Add sort order parameter for time-based sorting
      if (sortOrder === 'oldest') {
        queryParams.append('sort', 'createdAt:asc');
      } else {
        queryParams.append('sort', 'createdAt:desc'); // Default to newest first
      }
      
      const response = await fetch(`/api/announcements/system?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch system announcements');
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
        audience: 'Hệ thống', // All system announcements are for everyone
        createdBy: item.createdBy?.name || 'N/A'
      }));
      
      setAnnouncements(mappedAnnouncements);
    } catch (error) {
      console.error('Error fetching system announcements:', error);
      toast.error('Đã xảy ra lỗi khi tải thông báo hệ thống');
    } finally {
      setLoading(false);
    }
  };

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
      const response = await fetch(`/api/announcements/system/${announcementToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete system announcement');
      }
      
      toast.success('Đã xóa thông báo hệ thống thành công');
      fetchAnnouncements(); // Refresh the list
    } catch (error) {
      console.error('Error deleting system announcement:', error);
      toast.error('Đã xảy ra lỗi khi xóa thông báo hệ thống');
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

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  const renderPaginationControls = () => {
    // Calculate the range of visible page buttons
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center text-sm text-gray-600">
          <span>Hiển thị</span>
          <select
            className="mx-2 border-gray-300 rounded-md shadow-sm"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span>trên tổng số {totalItems} mục</span>
        </div>
        
        <div className="flex items-center">
          <button
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <FiChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          {pageNumbers.map(number => (
            <button
              key={number}
              className={`px-3 py-1.5 mx-0.5 rounded-md ${
                number === currentPage
                  ? 'bg-orange-100 text-orange-600 font-medium'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              onClick={() => setCurrentPage(number)}
            >
              {number}
            </button>
          ))}
          
          <button
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <FiChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="relative">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Quản lý thông báo hệ thống</h2>
          <div className="absolute -bottom-2 left-0 w-16 h-1 bg-orange-500 rounded"></div>
        </div>
        
        <Link
          href="/admin/announcements/create"
          className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md shadow-sm hover:bg-orange-700 transition-colors duration-150"
        >
          <FiPlus className="mr-1.5 h-4 w-4" />
          Tạo thông báo mới
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-gray-200">
          <div className="relative flex items-center w-full md:w-96 mb-4 md:mb-0">
            <FiSearch className="absolute left-3 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm thông báo..."
              className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center">
            <select
              className="w-full md:w-auto bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-700 text-sm"
              value={sortOrder}
              onChange={(e) => handleSortOrderChange(e.target.value as SortOrder)}
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="animate-pulse">
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
                      Trạng thái
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người tạo
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...Array(5)].map((_, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <div className="h-5 w-5 bg-gray-200 rounded"></div>
                          <div className="h-5 w-5 bg-gray-200 rounded"></div>
                          <div className="h-5 w-5 bg-gray-200 rounded"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-6">
              <div className="h-6 bg-gray-200 rounded w-56"></div>
              <div className="flex items-center space-x-1">
                <div className="h-9 w-9 bg-gray-200 rounded"></div>
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-9 w-9 bg-gray-200 rounded-md mx-0.5"></div>
                ))}
                <div className="h-9 w-9 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ) : paginatedAnnouncements.length > 0 ? (
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
                    Trạng thái
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người tạo
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedAnnouncements.map((announcement) => (
                  <tr key={announcement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {announcement.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{announcement.date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        announcement.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : announcement.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {announcement.status === 'published'
                          ? 'Đã đăng'
                          : announcement.status === 'pending'
                          ? 'Chờ duyệt'
                          : 'Nháp'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{announcement.createdBy}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/announcements/${announcement.id}`}
                          className="text-blue-600 hover:text-blue-700"
                          title="Xem chi tiết"
                        >
                          <FiInfo className="h-5 w-5" />
                        </Link>
                        <Link
                          href={`/admin/announcements/${announcement.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-90"
                          title="Chỉnh sửa"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Xóa"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FiBell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không có thông báo</h3>
            <p className="mt-1 text-sm text-gray-500">
              Bắt đầu bằng cách tạo thông báo mới cho hệ thống.
            </p>
            <div className="mt-6">
              <Link
                href="/admin/announcements/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                <FiPlus className="mr-2 -ml-1 h-5 w-5" />
                Thêm thông báo mới
              </Link>
            </div>
          </div>
        )}
        
        {totalPages > 1 && renderPaginationControls()}
      </div>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Xóa thông báo"
        message="Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác."
      />
    </div>
  );
} 