'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiInfo,
  FiFilter,
  FiSearch,
  FiCheckCircle,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiEdit2,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiArrowLeft,
  FiEdit
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  departmentId: string | null;
  isPublic: boolean;
  status: string;
  reviewedById: string | null;
  reviewedAt: string | null;
  tags: string[];
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  department: {
    id: string;
    name: string;
  } | null;
}

export default function AdminPostsReviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State for post management
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchDebounceTimeout, setSearchDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

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
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard');
        toast.error('Bạn không có quyền truy cập trang này');
      } else {
        fetchPosts();
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('page', currentPage.toString());
      searchParams.append('limit', itemsPerPage.toString());
      
      // Add search and filter params
      if (searchTerm) {
        searchParams.append('search', searchTerm);
      }
      
      if (selectedStatus) {
        // Map the selected status to the status parameter
        searchParams.append('status', selectedStatus);
      }
      
      const response = await fetch(`/api/posts?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const data = await response.json();
      setPosts(data.posts);
      
      // Update total items from the pagination data
      if (data.pagination && data.pagination.total !== undefined) {
        setTotalItems(data.pagination.total);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Đã xảy ra lỗi khi tải bài viết');
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
      setCurrentPage(1); // Reset to first page when searching
      fetchPosts(); // Fetch with the search term applied
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
    fetchPosts();
  }, [currentPage, itemsPerPage, selectedStatus]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDeletePost = (post: Post) => {
    setSelectedPost(post);
    setIsDeleteModalOpen(true);
  };

  const confirmDeletePost = async () => {
    if (!selectedPost) return;
    
    try {
      const response = await fetch(`/api/posts/${selectedPost.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
      
      // Update posts list after successful deletion
      fetchPosts();
      toast.success('Đã xóa bài viết thành công');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Đã xảy ra lỗi khi xóa bài viết');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleApprovePost = async (postId: string, approve: boolean) => {
    try {
      const response = await fetch('/api/posts/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          status: approve ? 'APPROVED' : 'PENDING'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update post approval status');
      }
      
      // Update posts list after successful approval/rejection
      fetchPosts();
      toast.success(approve ? 'Bài viết đã được phê duyệt' : 'Bài viết đã bị từ chối');
    } catch (error) {
      console.error('Error updating post approval:', error);
      toast.error('Đã xảy ra lỗi khi cập nhật trạng thái phê duyệt');
    }
  };

  const handleRejectPost = async (postId: string) => {
    try {
      const response = await fetch('/api/posts/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          status: 'REJECTED'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject post');
      }
      
      // Update posts list after successful rejection
      fetchPosts();
      toast.success('Bài viết đã bị từ chối');
    } catch (error) {
      console.error('Error rejecting post:', error);
      toast.error('Đã xảy ra lỗi khi từ chối bài viết');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage) return;
    
    // Check if the new page is valid based on total pages
    if (newPage > 0 && newPage <= totalFilteredPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Handle status filter changes
  const handleStatusFilterChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleClearFilters = () => {
    setSelectedStatus('');
    setSearchTerm('');
    setCurrentPage(1);
    fetchPosts(); // Fetch posts immediately after clearing filters
  };

  const handleRefresh = () => {
    fetchPosts();
    toast.success('Đã làm mới danh sách bài viết');
  };

  // Only filter posts based on local state for UI display
  // This can be removed later if all filtering is handled server-side
  const filteredPosts = posts;

  // Calculate pagination values from server data
  const totalFilteredItems = totalItems || filteredPosts.length;
  const totalFilteredPages = Math.ceil(totalFilteredItems / itemsPerPage);

  // Current items are now directly the posts returned from the server
  const currentItems = filteredPosts;

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-6">
        {/* Title section with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-4 h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <div className="mr-2 h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
              Quản lý bài viết
            </h1>
          </div>
          <div className="flex space-x-2">
            <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-10 w-28 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>

        {/* Search and filter section */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <div className="h-10 bg-gray-200 rounded-md animate-pulse w-full"></div>
              </div>
              <div className="h-10 w-20 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Post Status Pills */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-2">
            <div className="h-8 w-32 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-8 w-32 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-8 w-32 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Posts list skeleton */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bài viết
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phòng ban
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tác giả
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Skeleton rows */}
                {Array(5).fill(0).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-md bg-gray-200 animate-pulse"></div>
                        <div className="ml-4">
                          <div className="h-5 w-40 bg-gray-200 rounded-md animate-pulse"></div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <div className="h-4 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="h-4 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-5 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-5 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination skeleton */}
          <div className="bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 sm:px-6">
            <div className="mb-4 sm:mb-0">
              <div className="h-5 w-60 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="h-10 w-16 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
              <div className="inline-flex rounded-md shadow-sm -space-x-px">
                <div className="h-10 w-10 bg-gray-200 rounded-l-md animate-pulse"></div>
                <div className="h-10 w-10 bg-gray-200 animate-pulse"></div>
                <div className="h-10 w-10 bg-gray-200 animate-pulse"></div>
                <div className="h-10 w-10 bg-gray-200 animate-pulse"></div>
                <div className="h-10 w-10 bg-gray-200 animate-pulse"></div>
                <div className="h-10 w-10 bg-gray-200 rounded-r-md animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/admin/content-review" className="mr-4 text-gray-500 hover:text-gray-700 cursor-pointer">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            {/* <FiEdit className="mr-2 h-6 w-6 text-orange-500" /> */}
            Quản lý bài viết
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            <FiRefreshCw className="-ml-1 mr-2 h-4 w-4" />
            Làm mới
          </button>
          
        </div>
      </div>

      {/* Search and filter section */}
      <div className="bg-white shadow rounded-lg mb-6">
        {/* Search bar + filter trigger for desktop */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 sm:text-sm cursor-text"
                placeholder="Tìm kiếm bài viết..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center p-2.5 text-sm font-medium text-center text-white bg-orange-600 rounded-lg hover:bg-orange-700 cursor-pointer"
            >
              <FiFilter className="w-5 h-5" />
              <span className="ml-2 hidden sm:inline-block">Lọc</span>
            </button>
          </div>
        </div>

        {/* Active filter display */}
        {selectedStatus && (
          <div className="px-4 py-2 bg-gray-50 flex flex-wrap items-center gap-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 mr-0.5">Bộ lọc:</span>
            {selectedStatus && (
              <div className="inline-flex items-center bg-yellow-50 text-yellow-700 rounded-full text-xs px-2.5 py-1">
                <span className="mr-1 font-medium">
                  Trạng thái: {selectedStatus === 'APPROVED' ? 'Đã duyệt' : selectedStatus === 'PENDING' ? 'Chờ duyệt' : 'Đã từ chối'}
                </span>
                <button 
                  onClick={() => handleStatusFilterChange('')}
                  className="text-yellow-500 hover:text-yellow-700 cursor-pointer"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <button
              onClick={handleClearFilters}
              className="text-xs text-gray-500 hover:text-gray-700 ml-auto cursor-pointer"
            >
              Xóa tất cả
            </button>
          </div>
        )}

        {/* Filter panel */}
        <div className={`filter-panel border-gray-100 bg-gray-50 ${isFilterOpen ? 'open border-b' : ''}`}>
          <div className="px-4">
            <div className="w-full">
              {/* Status filter */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Trạng thái</label>
                <select
                  id="status-filter"
                  className="block w-full rounded-md border border-gray-300 py-2.5 px-3 bg-white text-gray-700 text-sm cursor-pointer"
                  value={selectedStatus}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="PENDING">Chờ duyệt</option>
                  <option value="REJECTED">Đã từ chối</option>
                </select>
              </div>
            </div>
            
            {/* Apply/Clear filters buttons */}
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => {
                  setIsFilterOpen(false);
                }}
                className="flex-1 bg-orange-600 text-white rounded-md py-2.5 px-4 text-sm font-medium hover:bg-orange-700 cursor-pointer"
              >
                Đóng
              </button>
              {selectedStatus && (
                <button
                  onClick={handleClearFilters}
                  className="py-2.5 px-4 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Banner for pending posts */}
      {filteredPosts.filter(post => post.status === 'PENDING').length > 0 && (
        <div className="rounded-md bg-yellow-50 p-4 mb-4 cursor-default">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiInfo className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Có {filteredPosts.filter(post => post.status === 'PENDING').length} bài viết đang chờ phê duyệt
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Bài viết chưa được phê duyệt sẽ không được hiển thị cho nhân viên. Vui lòng kiểm tra và phê duyệt các bài viết phù hợp.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Status Pills */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 cursor-default">
            <FiCheck className="mr-1 h-3 w-3" />
            Đã phê duyệt: {filteredPosts.filter(post => post.status === 'APPROVED').length}
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 cursor-default">
            <FiX className="mr-1 h-3 w-3" />
            Chờ phê duyệt: {filteredPosts.filter(post => post.status === 'PENDING').length}
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 cursor-default">
            <FiInfo className="mr-1 h-3 w-3" />
            Tổng số: {filteredPosts.length}
          </span>
        </div>
      </div>

      {/* Posts list */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none">
                  Bài viết
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none">
                  Phòng ban
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none">
                  Tác giả
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none">
                  Ngày tạo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none">
                  Trạng thái
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider select-none">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-sm text-center text-gray-500 select-none">
                    Không tìm thấy bài viết nào
                  </td>
                </tr>
              ) : (
                currentItems.map((post) => (
                  <tr key={post.id} className={post.status === 'PENDING' ? "bg-yellow-50 hover:bg-yellow-100" : "hover:bg-gray-50"}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-orange-100 rounded-md">
                          <FiEdit className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{post.title}</div>
                          <div className="text-sm text-gray-500 flex flex-wrap gap-1.5 mt-1">
                            {post.tags && post.tags.length > 0 ? (
                              post.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs italic">Không có thẻ</span>
                            )}
                            {post.tags && post.tags.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-full text-xs font-medium">
                                +{post.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-default">
                      {post.department?.name || 'Không có phòng ban'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-default">
                      {post.author.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-default">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {post.status === 'APPROVED' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 cursor-default">
                          Đã duyệt
                        </span>
                      ) : post.status === 'PENDING' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 cursor-default">
                          Chờ duyệt
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 cursor-default">
                          Từ chối
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center space-x-2">
                        <Link 
                          href={`/admin/content-review/posts/view/${post.id}`}
                          className="text-blue-600 hover:text-blue-900 p-1.5 rounded-full hover:bg-blue-50 cursor-pointer"
                          title="Xem"
                        >
                          <FiInfo className="h-5 w-5" />
                        </Link>
                        
                        <Link 
                          href={`/admin/content-review/posts/edit/${post.id}`}
                          className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded-full hover:bg-indigo-50 cursor-pointer"
                          title="Sửa"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </Link>
                        
                        <button
                          onClick={() => handleDeletePost(post)}
                          className="text-red-600 hover:text-red-900 p-1.5 rounded-full hover:bg-red-50 cursor-pointer"
                          title="Xóa"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                        
                        {post.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprovePost(post.id, true)}
                              className="text-green-600 hover:text-green-900 p-1.5 rounded-full hover:bg-green-50 cursor-pointer"
                              title="Phê duyệt"
                            >
                              <FiCheckCircle className="h-5 w-5" />
                            </button>
                            
                            <button
                              onClick={() => handleRejectPost(post.id)}
                              className="text-orange-600 hover:text-orange-900 p-1.5 rounded-full hover:bg-orange-50 cursor-pointer"
                              title="Từ chối"
                            >
                              <FiX className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 sm:px-6"> 
          <div className="mb-4 sm:mb-0">
            <p className="text-sm text-gray-700">
              Hiển thị{' '}
              <span className="font-medium">
                {currentItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
              </span>{' '}
              đến{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, totalFilteredItems)}
              </span>{' '}
              trong số <span className="font-medium">{totalFilteredItems}</span> kết quả
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
                disabled={currentPage === 1 || loading}
                onClick={() => handlePageChange(currentPage - 1)}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === 1 || loading
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <span className="sr-only">Previous</span>
                <FiChevronLeft className="h-5 w-5" />
              </button>
              
              {Array.from({ length: Math.min(5, totalFilteredPages) }, (_, i) => {
                let pageNum;
                
                if (totalFilteredPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalFilteredPages - 2) {
                  pageNum = totalFilteredPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === pageNum
                        ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    } ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                disabled={currentPage === totalFilteredPages || loading}
                onClick={() => handlePageChange(currentPage + 1)}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === totalFilteredPages || loading
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <span className="sr-only">Next</span>
                <FiChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeletePost}
        title="Xóa bài viết"
        message={`Bạn có chắc chắn muốn xóa bài viết "${selectedPost?.title}" không? Hành động này không thể hoàn tác.`}
      />
    </div>
  );
}
