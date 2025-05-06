'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiFilter,
  FiSearch,
  FiPlus,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiDownload,
  FiEdit2,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiArrowLeft,
  FiFileText
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

interface Document {
  id: string;
  title: string;
  description: string | null;
  category: string;
  filePath: string;
  isPublic: boolean;
  uploadedById: string;
  departmentId: string | null;
  createdAt: string;
  updatedAt: string;
  uploadedBy: {
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

export default function AdminDocumentsReviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State for document management
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchDebounceTimeout, setSearchDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Document categories from the schema
  const documentCategories = [
    { value: 'REPORT', label: 'Báo cáo', color: 'bg-blue-100 text-blue-800' },
    { value: 'CONTRACT', label: 'Hợp đồng', color: 'bg-purple-100 text-purple-800' },
    { value: 'GUIDE', label: 'Hướng dẫn', color: 'bg-green-100 text-green-800' },
    { value: 'FORM', label: 'Biểu mẫu', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'OTHER', label: 'Khác', color: 'bg-gray-100 text-gray-800' }
  ];

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
        fetchDocuments();
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (searchTerm) {
        searchParams.append('search', searchTerm);
      }
      if (selectedCategory) {
        searchParams.append('category', selectedCategory);
      }
      if (selectedStatus) {
        searchParams.append('status', selectedStatus);
      }
      searchParams.append('page', currentPage.toString());
      searchParams.append('limit', itemsPerPage.toString());
      
      const response = await fetch(`/api/documents?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      const data = await response.json();
      setDocuments(data.documents);
      setTotalItems(data.pagination.total);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Đã xảy ra lỗi khi tải tài liệu');
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
      fetchDocuments();
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
    fetchDocuments();
  }, [currentPage, itemsPerPage, selectedCategory, selectedStatus]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getCategoryName = (categoryValue: string) => {
    const category = documentCategories.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  const getCategoryColor = (categoryValue: string) => {
    const category = documentCategories.find(cat => cat.value === categoryValue);
    return category ? category.color : 'bg-gray-100 text-gray-800';
  };

  const handleDeleteDocument = (document: Document) => {
    setSelectedDocument(document);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteDocument = async () => {
    if (!selectedDocument) return;
    
    try {
      const response = await fetch(`/api/documents/${selectedDocument.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      // Update documents list after successful deletion
      fetchDocuments();
      toast.success('Đã xóa tài liệu thành công');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Đã xảy ra lỗi khi xóa tài liệu');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleApproveDocument = async (documentId: string, approve: boolean) => {
    try {
      const response = await fetch('/api/documents/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          isApproved: approve
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update document approval status');
      }
      
      // Update documents list after successful approval/rejection
      fetchDocuments();
      toast.success(approve ? 'Tài liệu đã được phê duyệt' : 'Tài liệu đã bị từ chối');
    } catch (error) {
      console.error('Error updating document approval:', error);
      toast.error('Đã xảy ra lỗi khi cập nhật trạng thái phê duyệt');
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
  const handleCategoryFilterChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleStatusFilterChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedStatus('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchDocuments();
    toast.success('Đã làm mới danh sách tài liệu');
  };

  // Filter documents based on search term and filters
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.uploadedBy?.name && doc.uploadedBy.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.department?.name && doc.department.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === '' || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === '' || 
      (selectedStatus === 'PUBLIC' && doc.isPublic) ||
      (selectedStatus === 'PRIVATE' && !doc.isPublic);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading && documents.length === 0) {
    return (
      <div className="space-y-6">
        {/* Title section with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-4 h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <div className="mr-2 h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
              Quản lý tài liệu
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

        {/* Document Status Pills */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-2">
            <div className="h-8 w-32 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-8 w-32 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-8 w-32 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Documents list skeleton */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tài liệu
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phân loại
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phòng ban
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người tải lên
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
                          <div className="mt-1 h-4 w-64 bg-gray-200 rounded-md animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse"></div>
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
            <FiFileText className="mr-2 h-6 w-6 text-orange-500" />
            Quản lý tài liệu
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
          
          <Link
            href="/admin/content-review/documents/add"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 cursor-pointer"
          >
            <FiPlus className="-ml-1 mr-2 h-4 w-4" />
            Thêm tài liệu
          </Link>
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
                placeholder="Tìm kiếm tài liệu..."
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
        {(selectedCategory || selectedStatus) && (
          <div className="px-4 py-2 bg-gray-50 flex flex-wrap items-center gap-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 mr-0.5">Bộ lọc:</span>
            {selectedCategory && (
              <div className="inline-flex items-center bg-orange-50 text-orange-700 rounded-full text-xs px-2.5 py-1">
                <span className="mr-1 font-medium">
                  Phân loại: {getCategoryName(selectedCategory)}
                </span>
                <button 
                  onClick={() => handleCategoryFilterChange('')}
                  className="text-orange-500 hover:text-orange-700 cursor-pointer"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {selectedStatus && (
              <div className="inline-flex items-center bg-yellow-50 text-yellow-700 rounded-full text-xs px-2.5 py-1">
                <span className="mr-1 font-medium">
                  Trạng thái: {selectedStatus === 'PUBLIC' ? 'Đã duyệt' : 'Chưa duyệt'}
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Category filter */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Phân loại tài liệu</label>
                <select
                  id="category-filter"
                  className="block w-full rounded-md border border-gray-300 py-2.5 px-3 bg-white text-gray-700 text-sm cursor-pointer"
                  value={selectedCategory}
                  onChange={(e) => handleCategoryFilterChange(e.target.value)}
                  disabled={!isFilterOpen}
                >
                  <option value="">Tất cả phân loại</option>
                  {documentCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Trạng thái</label>
                <select
                  id="status-filter"
                  className="block w-full rounded-md border border-gray-300 py-2.5 px-3 bg-white text-gray-700 text-sm cursor-pointer"
                  value={selectedStatus}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  disabled={!isFilterOpen}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="PUBLIC">Đã duyệt</option>
                  <option value="PRIVATE">Chưa duyệt</option>
                </select>
              </div>
            </div>
            
            {/* Apply/Clear filters buttons */}
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => {
                  if (selectedCategory || selectedStatus) {
                    setCurrentPage(1); // Reset to first page when applying filters
                  }
                  setIsFilterOpen(false);
                }}
                className="flex-1 bg-orange-600 text-white rounded-md py-2.5 px-4 text-sm font-medium hover:bg-orange-700 cursor-pointer"
              >
                Đóng
              </button>
              {(selectedCategory || selectedStatus) && (
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

      {/* Banner for pending documents */}
      {documents.filter(doc => !doc.isPublic).length > 0 && (
        <div className="rounded-md bg-yellow-50 p-4 mb-4 cursor-default">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiInfo className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Có {documents.filter(doc => !doc.isPublic).length} tài liệu đang chờ phê duyệt
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Tài liệu chưa được phê duyệt sẽ không được hiển thị cho nhân viên. Vui lòng kiểm tra và phê duyệt các tài liệu phù hợp.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Status Pills */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 cursor-default">
            <FiCheck className="mr-1 h-3 w-3" />
            Đã phê duyệt: {documents.filter(doc => doc.isPublic).length}
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 cursor-default">
            <FiX className="mr-1 h-3 w-3" />
            Chờ phê duyệt: {documents.filter(doc => !doc.isPublic).length}
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 cursor-default">
            <FiInfo className="mr-1 h-3 w-3" />
            Tổng số: {documents.length}
          </span>
        </div>
      </div>

      {/* Documents list */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 cursor-default">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tài liệu
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phân loại
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phòng ban
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người tải lên
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
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-sm text-center text-gray-500 cursor-default">
                    Không tìm thấy tài liệu nào
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className={!doc.isPublic ? "bg-yellow-50 hover:bg-yellow-100 cursor-default" : "hover:bg-gray-50 cursor-default"}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-orange-100 rounded-md">
                          <FiFileText className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                          {doc.description && (
                            <div className="text-sm text-gray-500 line-clamp-1">{doc.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(doc.category)}`}>
                        {getCategoryName(doc.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-default">
                      {doc.department?.name || 'Không có phòng ban'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-default">
                      {doc.uploadedBy.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-default">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.isPublic ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 cursor-default">
                          Đã duyệt
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 cursor-default">
                          Chờ duyệt
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center space-x-2">
                        <a 
                          href={doc.filePath}
                          download
                          className="text-green-600 hover:text-green-900 p-1.5 rounded-full hover:bg-green-50 cursor-pointer"
                          title="Tải xuống"
                        >
                          <FiDownload className="h-5 w-5" />
                        </a>
                        
                        <Link 
                          href={`/admin/content-review/documents/edit/${doc.id}`}
                          className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded-full hover:bg-indigo-50 cursor-pointer"
                          title="Sửa"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </Link>
                        
                        <button
                          onClick={() => handleDeleteDocument(doc)}
                          className="text-red-600 hover:text-red-900 p-1.5 rounded-full hover:bg-red-50 cursor-pointer"
                          title="Xóa"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                        
                        {!doc.isPublic && (
                          <button
                            onClick={() => handleApproveDocument(doc.id, true)}
                            className="text-green-600 hover:text-green-900 p-1.5 rounded-full hover:bg-green-50 cursor-pointer"
                            title="Phê duyệt"
                          >
                            <FiCheckCircle className="h-5 w-5" />
                          </button>
                        )}
                        
                        {doc.isPublic && (
                          <button
                            onClick={() => handleApproveDocument(doc.id, false)}
                            className="text-red-600 hover:text-red-900 p-1.5 rounded-full hover:bg-red-50 cursor-pointer"
                            title="Hủy duyệt"
                          >
                            <FiXCircle className="h-5 w-5" />
                          </button>
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
                {documents.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
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
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Previous</span>
                <FiChevronLeft className="h-5 w-5" />
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
                    disabled={loading}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === pageNum
                        ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                disabled={currentPage === totalPages || loading}
                onClick={() => handlePageChange(currentPage + 1)}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === totalPages || loading
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
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteDocument}
        title="Xóa tài liệu"
        message={`Bạn có chắc chắn muốn xóa tài liệu "${selectedDocument?.title}" không? Hành động này không thể hoàn tác.`}
      />
    </div>
  );
} 