'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight, FiInfo, FiFileText, FiFilter, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Image from 'next/image';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

interface Post {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  authorId: string;
  departmentId: string;
  status: string;
  reviewedById?: string;
  reviewedBy?: {
    id: string;
    name: string;
  };
  reviewedAt?: string;
  tags: string[];
  coverImageUrl?: string;
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
  };
}

export default function DepartmentPostsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchDebounceTimeout, setSearchDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [selectedPublicStatus, setSelectedPublicStatus] = useState<string>('');
  const [selectedContentStatus, setSelectedContentStatus] = useState<string>('');
  
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
    // Chỉ cho phép trưởng phòng truy cập trang này
    if (status === 'authenticated') {
      if (session?.user?.role !== 'DEPARTMENT_HEAD') {
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
      if (searchTerm) {
        searchParams.append('search', searchTerm);
      }
      if (selectedPublicStatus) {
        searchParams.append('isPublic', selectedPublicStatus);
      }
      if (selectedContentStatus) {
        searchParams.append('status', selectedContentStatus);
      }
      searchParams.append('page', currentPage.toString());
      searchParams.append('limit', itemsPerPage.toString());
      
      const response = await fetch(`/api/posts?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const data = await response.json();
      setPosts(data.posts);
      setTotalItems(data.pagination.total);
    } catch (error) {
      console.error('Lỗi khi tải bài viết:', error);
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
      fetchPosts();
    }, 300);
    
    setSearchDebounceTimeout(timeout);

    // Cleanup function
    return () => {
      if (searchDebounceTimeout) {
        clearTimeout(searchDebounceTimeout);
      }
    };
  }, [searchTerm]);

  // Handle pagination changes
  useEffect(() => {
    fetchPosts();
  }, [currentPage, itemsPerPage, selectedPublicStatus, selectedContentStatus]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    // Remove HTML tags for display
    const textContent = content.replace(/<[^>]*>/g, '');
    
    if (textContent.length <= maxLength) return textContent;
    return textContent.substring(0, maxLength) + '...';
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
      console.error('Lỗi khi xóa bài viết:', error);
      toast.error('Đã xảy ra lỗi khi xóa bài viết');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage) return;
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Handle filter changes
  const handlePublicStatusFilterChange = (status: string) => {
    if (status !== selectedPublicStatus) {
      setSelectedPublicStatus(status);
      setCurrentPage(1); // Reset to first page when filter changes
    }
  };
  
  const handleContentStatusFilterChange = (status: string) => {
    if (status !== selectedContentStatus) {
      setSelectedContentStatus(status);
      setCurrentPage(1); // Reset to first page when filter changes
    }
  };
  
  const clearAllFilters = () => {
    setSelectedPublicStatus('');
    setSelectedContentStatus('');
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-orange-600" role="status">
          <span className="visually-hidden"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-16 sm:pb-0">
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
                placeholder="Tìm kiếm bài viết..."
                className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-center whitespace-nowrap bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
            >
              <FiFilter className="h-4 w-4 mr-1.5 text-gray-500" />
              <span>Bộ lọc</span>
              {(selectedPublicStatus || selectedContentStatus) && (
                <span className="ml-1.5 flex items-center justify-center bg-orange-500 text-white text-xs rounded-full w-5 h-5 font-medium">
                  {(selectedPublicStatus ? 1 : 0) + (selectedContentStatus ? 1 : 0)}
                </span>
              )}
            </button>
            <Link href="/manager/posts/create">
              <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200 cursor-pointer">
                <FiPlus className="mr-2" /> Thêm bài viết
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
                placeholder="Tìm kiếm bài viết..."
                className="pl-10 pr-10 block w-full rounded-md border border-gray-300 bg-white py-2.5 px-3 text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer p-1"
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
              className="flex items-center justify-center w-full py-2.5 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
            >
              <FiFilter className="h-4 w-4 mr-2 text-gray-500" />
              <span>Bộ lọc</span>
              {(selectedPublicStatus || selectedContentStatus) && (
                <span className="ml-1.5 flex items-center justify-center bg-orange-500 text-white text-xs rounded-full w-5 h-5 font-medium">
                  {(selectedPublicStatus ? 1 : 0) + (selectedContentStatus ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active filters display */}
        {(selectedPublicStatus || selectedContentStatus) && (
          <div className="px-4 py-2 bg-gray-50 flex flex-wrap items-center gap-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 mr-0.5">Bộ lọc:</span>
            
            {selectedPublicStatus && (
              <div className="inline-flex items-center bg-orange-50 text-orange-700 rounded-full text-xs px-2.5 py-1">
                <span className="mr-1 font-medium">
                  Phạm vi: {selectedPublicStatus === 'true' ? 'Công khai' : 'Nội bộ'}
                </span>
                <button 
                  onClick={() => handlePublicStatusFilterChange('')}
                  className="text-orange-500 hover:text-orange-700 focus:outline-none cursor-pointer"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            
            {selectedContentStatus && (
              <div className="inline-flex items-center bg-orange-50 text-orange-700 rounded-full text-xs px-2.5 py-1">
                <span className="mr-1 font-medium">
                  Trạng thái: {
                    selectedContentStatus === 'PENDING' ? 'Đang chờ duyệt' : 
                    selectedContentStatus === 'APPROVED' ? 'Đã duyệt' : 
                    'Đã từ chối'
                  }
                </span>
                <button 
                  onClick={() => handleContentStatusFilterChange('')}
                  className="text-orange-500 hover:text-orange-700 focus:outline-none cursor-pointer"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            
            <button
              onClick={clearAllFilters}
              className="text-xs text-gray-500 hover:text-gray-700 ml-auto focus:outline-none cursor-pointer"
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
                <label className="block text-xs font-medium text-gray-700">Phạm vi</label>
                <select
                  value={selectedPublicStatus}
                  onChange={(e) => handlePublicStatusFilterChange(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2.5 px-3 bg-white text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
                  disabled={!isFilterOpen}
                >
                  <option value="">Tất cả phạm vi</option>
                  <option value="true">Công khai</option>
                  <option value="false">Nội bộ</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Trạng thái duyệt</label>
                <select
                  value={selectedContentStatus}
                  onChange={(e) => handleContentStatusFilterChange(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2.5 px-3 bg-white text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
                  disabled={!isFilterOpen}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="PENDING">Đang chờ duyệt</option>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="REJECTED">Đã từ chối</option>
                </select>
              </div>
            </div>
            
            {/* Apply/Clear filters buttons */}
            <div className="flex items-center mt-4 gap-2">
              <button
                onClick={() => {
                  // Apply current filter values
                  fetchPosts();
                  setIsFilterOpen(false);
                }}
                className="flex-1 bg-orange-600 text-white rounded-md py-2.5 px-4 text-sm font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 cursor-pointer"
              >
                Áp dụng bộ lọc
              </button>
              {(selectedPublicStatus || selectedContentStatus) && (
                <button
                  onClick={clearAllFilters}
                  className="py-2.5 px-4 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Posts list */}
      <div className="bg-white shadow rounded-lg overflow-hidden relative">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <FiFileText className="mr-2 h-5 w-5 text-gray-500" />
            Danh sách bài viết
          </h2>
        </div>
        
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-orange-600"></div>
          </div>
        )}

        {posts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bài viết
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tác giả
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phạm vi
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
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 mr-3 relative rounded-md overflow-hidden">
                          {post.coverImageUrl ? (
                            <Image 
                              src={post.coverImageUrl} 
                              alt={post.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-orange-100 rounded-md">
                              <FiFileText className="h-5 w-5 text-orange-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{post.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{truncateContent(post.content)}</div>
                          {post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {post.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                              {post.tags.length > 3 && (
                                <span className="text-xs text-gray-500">+{post.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.author.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${post.isPublic ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {post.isPublic ? 'Công khai' : 'Nội bộ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        post.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                        post.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {post.status === 'PENDING' ? 'Đang chờ duyệt' : 
                         post.status === 'APPROVED' ? 'Đã duyệt' : 
                         'Đã từ chối'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-3 justify-end">
                        <Link href={`/manager/posts/${post.id}`}>
                          <button className="text-blue-600 hover:text-blue-900 cursor-pointer" title="Xem chi tiết">
                            <FiInfo className="w-5 h-5" />
                          </button>
                        </Link>
                        <Link href={`/manager/posts/edit/${post.id}`}>
                          <button className="text-indigo-600 hover:text-indigo-900 cursor-pointer" title="Chỉnh sửa">
                            <FiEdit2 className="w-5 h-5" />
                          </button>
                        </Link>
                        <button 
                          onClick={() => handleDeletePost(post)} 
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
            Không có bài viết nào. Hãy tạo bài viết mới.
          </div>
        )}
        
        {/* Pagination */}
        {totalItems > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-700 mr-4">
                  Hiển thị <span className="font-semibold text-gray-900">{posts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> đến <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, totalItems)}</span> trong số <span className="font-semibold text-gray-900">{totalItems}</span> bài viết
                </p>
                <div className="relative">
                  <select
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    className="appearance-none pl-8 pr-10 py-2.5 bg-white border border-gray-300 rounded-md shadow-sm text-gray-800 font-medium focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
                  >
                    <option value="5">5 / trang</option>
                    <option value="10">10 / trang</option>
                    <option value="25">25 / trang</option>
                    <option value="50">50 / trang</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-orange-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50 cursor-pointer'}`}
                  >
                    <span className="sr-only">Previous</span>
                    <FiChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {/* Generate page buttons */}
                  {Array.from({ length: Math.max(1, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    // Show current page and neighbors, first and last page
                    if (
                      pageNum === 1 || 
                      pageNum === totalPages || 
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 cursor-pointer'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    
                    // Add ellipsis if needed
                    if (
                      totalPages > 3 && (
                      pageNum === 2 || 
                      pageNum === totalPages - 1)
                    ) {
                      return (
                        <span
                          key={`ellipsis-${pageNum}`}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
                      );
                    }
                    
                    return null;
                  }).filter(Boolean)}
                  
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50 cursor-pointer'}`}
                  >
                    <span className="sr-only">Next</span>
                    <FiChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
            
            <div className="flex sm:hidden items-center justify-between w-full">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
              >
                Trước
              </button>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 mr-2">
                  Trang {currentPage} / {Math.max(1, totalPages)}
                </span>
                <div className="relative">
                  <select
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    className="appearance-none pl-8 pr-6 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-800 font-medium focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-orange-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
              >
                Tiếp
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FAB for adding posts on mobile */}
      <div className="sm:hidden fixed bottom-6 right-6 z-10">
        <Link href="/manager/posts/create">
          <button className="flex items-center justify-center w-14 h-14 rounded-full bg-orange-600 text-white shadow-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200">
            <FiPlus className="h-6 w-6" />
          </button>
        </Link>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedPost && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDeletePost}
          title="Xóa bài viết"
          message={`Bạn có chắc chắn muốn xóa bài viết "${selectedPost.title}" không? Hành động này không thể hoàn tác.`}
        />
      )}
    </div>
  );
} 