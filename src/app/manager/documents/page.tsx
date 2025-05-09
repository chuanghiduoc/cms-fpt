'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiPlus, 
  FiSearch, 
  FiEdit2, 
  FiTrash2, 
  FiChevronLeft, 
  FiChevronRight, 
  FiFileText, 
  FiFilter, 
  FiX,
  FiDownload,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

// Define TypeScript interfaces
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
  status: string;
}

interface Department {
  id: string;
  name: string;
}

export default function DocumentsManagerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State for document management
  const [documents, setDocuments] = useState<Document[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchDebounceTimeout, setSearchDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  
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

  // Document status from the schema
  const documentStatuses = [
    { value: 'PENDING', label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'APPROVED', label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
    { value: 'REJECTED', label: 'Từ chối', color: 'bg-red-100 text-red-800' }
  ];

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Lỗi khi tải phòng ban:', error);
    }
  }, []);

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

  // Xử lý authentication
  useEffect(() => {
    // Chỉ cho phép trưởng phòng và admin truy cập trang này
    if (status === 'authenticated') {
      if (session?.user?.role !== 'DEPARTMENT_HEAD' && session?.user?.role !== 'ADMIN') {
        router.push('/dashboard');
        toast.error('Bạn không có quyền truy cập trang này');
      } else {
        fetchDepartments();
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router, fetchDepartments]);

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

  // Tách fetchDocuments thành một useEffect riêng
  useEffect(() => {
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
        if (selectedVisibility) {
          searchParams.append('visibility', selectedVisibility);
        }
        if (selectedDepartment) {
          searchParams.append('department', selectedDepartment);
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
        console.error('Lỗi khi tải tài liệu:', error);
        toast.error('Đã xảy ra lỗi khi tải tài liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [searchTerm, selectedCategory, selectedStatus, selectedVisibility, selectedDepartment, currentPage, itemsPerPage]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const truncateContent = (content: string | null, maxLength: number = 100) => {
    if (!content) return '';
    
    // Remove HTML tags for display if any
    const textContent = content.replace(/<[^>]*>/g, '');
    
    if (textContent.length <= maxLength) return textContent;
    return textContent.substring(0, maxLength) + '...';
  };

  const getCategoryName = (categoryValue: string) => {
    const category = documentCategories.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  const getCategoryColor = (categoryValue: string) => {
    const category = documentCategories.find(cat => cat.value === categoryValue);
    return category ? category.color : 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const statusObj = documentStatuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const statusObj = documentStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
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
      
      // Cách tốt hơn để cập nhật UI sau khi xóa
      setDocuments(docs => docs.filter(doc => doc.id !== selectedDocument.id));
      toast.success('Đã xóa tài liệu thành công');
    } catch (error) {
      console.error('Lỗi khi xóa tài liệu:', error);
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
      
      // Cập nhật trực tiếp UI sau khi phê duyệt/từ chối thành công
      setDocuments(docs => docs.map(doc => 
        doc.id === documentId 
          ? {...doc, isPublic: approve, status: approve ? 'APPROVED' : 'REJECTED'} 
          : doc
      ));
      
      toast.success(approve ? 'Tài liệu đã được phê duyệt và đặt công khai' : 'Tài liệu đã bị từ chối công khai');
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái tài liệu:', error);
      toast.error('Đã xảy ra lỗi khi cập nhật trạng thái tài liệu');
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
    if (category !== selectedCategory) {
      setSelectedCategory(category);
      setCurrentPage(1); // Reset to first page when filter changes
      setIsFilterOpen(false); // Close the filter panel when a filter is applied
    }
  };

  const handleStatusFilterChange = (status: string) => {
    if (status !== selectedStatus) {
      setSelectedStatus(status);
      setCurrentPage(1); // Reset to first page when filter changes
      setIsFilterOpen(false); // Close the filter panel when a filter is applied
    }
  };

  const handleVisibilityFilterChange = (visibility: string) => {
    if (visibility !== selectedVisibility) {
      setSelectedVisibility(visibility);
      setCurrentPage(1); // Reset to first page when filter changes
      setIsFilterOpen(false); // Close the filter panel when a filter is applied
    }
  };

  const handleDepartmentFilterChange = (department: string | null) => {
    if (department !== selectedDepartment) {
      setSelectedDepartment(department);
      setCurrentPage(1); // Reset to first page when filter changes
      setIsFilterOpen(false); // Close the filter panel when a filter is applied
    }
  };

  // Replace handleClearFilters with direct calls to reset filters
  const resetAllFilters = () => {
    setSelectedCategory('');
    setSelectedStatus('');
    setSelectedVisibility('');
    setSelectedDepartment(null);
    setCurrentPage(1);
  };

  if (loading && documents.length === 0) {
    return (
      <div className="space-y-6 relative pb-16 sm:pb-0">
        {/* Search and filter section - real elements instead of skeleton */}
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
                placeholder="Tìm kiếm tài liệu..."
                className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
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
                disabled
                className="flex items-center justify-center whitespace-nowrap bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-700 outline-none cursor-not-allowed opacity-75"
              >
                <FiFilter className="h-4 w-4 mr-1.5 text-gray-500" />
                <span>Bộ lọc</span>
              </button>
              <Link href="/manager/documents/upload">
                <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 outline-none transition-colors duration-200 cursor-pointer">
                  <FiPlus className="mr-2" /> Thêm tài liệu
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
                  placeholder="Tìm kiếm tài liệu..."
                  className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
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
            <div className="p-2 border-b border-gray-100">
              <div className="flex space-x-2">
                <button
                  disabled
                  className="flex items-center justify-center flex-1 py-2.5 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-700 outline-none cursor-not-allowed opacity-75"
                >
                  <FiFilter className="h-4 w-4 mr-2 text-gray-500" />
                  <span>Bộ lọc</span>
                </button>
                
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton for documents list */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Real heading instead of skeleton */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <FiFileText className="mr-2 h-5 w-5 text-gray-500" />
              Danh sách tài liệu
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[...Array(9)].map((_, i) => (
                    <th key={i} scope="col" className="px-6 py-3 text-left">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-6 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="ml-3">
                          <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-5 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-5 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-5 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-3 justify-end">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="flex space-x-2">
                <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          </div>
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
                placeholder="Tìm kiếm tài liệu..."
                className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
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
              {(selectedCategory || selectedStatus || selectedVisibility || selectedDepartment) && (
                <span className="ml-1.5 flex items-center justify-center bg-orange-500 text-white text-xs rounded-full w-5 h-5 font-medium">
                  {Number(!!selectedCategory) + Number(!!selectedStatus) + Number(!!selectedVisibility) + Number(!!selectedDepartment)}
                </span>
              )}
            </button>
            <Link href="/manager/documents/upload">
              <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 outline-none transition-colors duration-200 cursor-pointer">
                <FiPlus className="mr-2" /> Thêm tài liệu
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
                placeholder="Tìm kiếm tài liệu..."
                className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
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
          <div className="p-2 border-b border-gray-100">
            <div className="flex space-x-2">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center justify-center flex-1 py-2.5 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 outline-none transition-colors"
              >
                <FiFilter className="h-4 w-4 mr-2 text-gray-500" />
                <span>Bộ lọc</span>
                {(selectedCategory || selectedStatus || selectedVisibility || selectedDepartment) && (
                  <span className="ml-1.5 flex items-center justify-center bg-orange-500 text-white text-xs rounded-full w-5 h-5 font-medium">
                    {Number(!!selectedCategory) + Number(!!selectedStatus) + Number(!!selectedVisibility) + Number(!!selectedDepartment)}
                  </span>
                )}
              </button>
              
            </div>
          </div>
        </div>

        {/* Active filters display */}
        {(selectedCategory || selectedStatus || selectedVisibility || selectedDepartment) && (
          <div className="px-4 py-2 bg-gray-50 flex flex-wrap items-center gap-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 mr-0.5">Bộ lọc:</span>
            {selectedCategory && (
              <div className="inline-flex items-center bg-orange-50 text-orange-700 rounded-full text-xs px-2.5 py-1">
                <span className="mr-1 font-medium">
                  Phân loại: {getCategoryName(selectedCategory)}
                </span>
                <button 
                  onClick={() => handleCategoryFilterChange('')}
                  className="text-orange-500 hover:text-orange-700 outline-none cursor-pointer"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {selectedStatus && (
              <div className="inline-flex items-center bg-yellow-50 text-yellow-700 rounded-full text-xs px-2.5 py-1">
                <span className="mr-1 font-medium">
                  Trạng thái: {getStatusLabel(selectedStatus)}
                </span>
                <button 
                  onClick={() => handleStatusFilterChange('')}
                  className="text-yellow-500 hover:text-yellow-700 outline-none cursor-pointer"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {selectedVisibility && (
              <div className="inline-flex items-center bg-green-50 text-green-700 rounded-full text-xs px-2.5 py-1">
                <span className="mr-1 font-medium">
                  Phạm vi: {selectedVisibility === 'PUBLIC' ? 'Công khai' : 'Nội bộ'}
                </span>
                <button 
                  onClick={() => handleVisibilityFilterChange('')}
                  className="text-green-500 hover:text-green-700 outline-none cursor-pointer"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {selectedDepartment && (
              <div className="inline-flex items-center bg-blue-50 text-blue-700 rounded-full text-xs px-2.5 py-1">
                <span className="mr-1 font-medium">
                  Phòng ban: {departments.find(d => d.id === selectedDepartment)?.name || 'Không xác định'}
                </span>
                <button 
                  onClick={() => handleDepartmentFilterChange(null)}
                  className="text-blue-500 hover:text-blue-700 outline-none cursor-pointer"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <button
              onClick={resetAllFilters}
              className="text-xs text-gray-500 hover:text-gray-700 outline-none cursor-pointer"
            >
              Xóa tất cả
            </button>
          </div>
        )}

        {/* Filter dropdown panel - always in the DOM, toggled with classes */}
        <div className={`filter-panel border-gray-100 bg-gray-50 ${isFilterOpen ? 'open border-b' : ''}`}>
          <div className="px-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Category filter */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Phân loại tài liệu</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryFilterChange(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2.5 px-3 bg-white text-gray-700 text-sm outline-none cursor-pointer"
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
                  value={selectedStatus}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2.5 px-3 bg-white text-gray-700 text-sm outline-none cursor-pointer"
                  disabled={!isFilterOpen}
                >
                  <option value="">Tất cả trạng thái</option>
                  {documentStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visibility filter */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Phạm vi</label>
                <select
                  value={selectedVisibility}
                  onChange={(e) => handleVisibilityFilterChange(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2.5 px-3 bg-white text-gray-700 text-sm outline-none cursor-pointer"
                  disabled={!isFilterOpen}
                >
                  <option value="">Tất cả phạm vi</option>
                  <option value="PUBLIC">Công khai</option>
                  <option value="PRIVATE">Nội bộ</option>
                </select>
              </div>

              {/* Department filter */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Phòng ban</label>
                <select
                  value={selectedDepartment || ''}
                  onChange={(e) => handleDepartmentFilterChange(e.target.value === '' ? null : e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2.5 px-3 bg-white text-gray-700 text-sm outline-none cursor-pointer"
                  disabled={!isFilterOpen}
                >
                  <option value="">Tất cả phòng ban</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Apply/Clear filters buttons */}
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => {
                  // Explicitly apply the current filter value
                  if (selectedCategory || selectedStatus || selectedVisibility || selectedDepartment) {
                    setCurrentPage(1); // Reset to first page when applying filters
                  }
                  setIsFilterOpen(false);
                }}
                className="flex-1 bg-orange-600 text-white rounded-md py-2.5 px-4 text-sm font-medium hover:bg-orange-700 outline-none cursor-pointer"
              >
                Áp dụng bộ lọc
              </button>
              {(selectedCategory || selectedStatus || selectedVisibility || selectedDepartment) && (
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedStatus('');
                    setSelectedVisibility('');
                    setSelectedDepartment(null);
                    setCurrentPage(1);
                  }}
                  className="py-2.5 px-4 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 outline-none cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Documents list */}
      <div className="bg-white shadow rounded-lg overflow-hidden relative">
        {/* Header with title */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <FiFileText className="mr-2 h-5 w-5 text-gray-500" />
            Danh sách tài liệu
          </h2>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <div className="w-full max-w-md grid grid-cols-4 gap-3 px-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-6 bg-gray-200 rounded-md animate-pulse"></div>
              ))}
            </div>
          </div>
        )}

        {documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STT
                  </th>
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phạm vi
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc, index) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-orange-100 rounded-md mr-3">
                          <FiFileText className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{truncateContent(doc.description)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColor(doc.category)}`}>
                        {getCategoryName(doc.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.department?.name || 'Không có phòng ban'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{doc.uploadedBy.name}</div>
                      <div className="text-xs text-gray-500">{doc.uploadedBy.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                        {getStatusLabel(doc.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doc.isPublic ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {doc.isPublic ? 'Công khai' : 'Nội bộ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-3 justify-end">
                        <a 
                          href={doc.filePath}
                          download
                          className="text-green-600 hover:text-green-900 cursor-pointer" 
                          title="Tải xuống"
                        >
                          <FiDownload className="w-5 h-5" />
                        </a>
                        
                        <Link 
                          href={`/manager/documents/edit/${doc.id}`}
                          className="text-indigo-600 hover:text-indigo-900 cursor-pointer" 
                          title="Chỉnh sửa"
                        >
                          <FiEdit2 className="w-5 h-5" />
                        </Link>
                        
                        <button
                          onClick={() => handleDeleteDocument(doc)}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                          title="Xóa"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                        
                        {session?.user?.role === 'ADMIN' && doc.status === 'PENDING' && (
                          <button
                            onClick={() => handleApproveDocument(doc.id, true)}
                            className="text-green-600 hover:text-green-900 cursor-pointer"
                            title="Phê duyệt"
                          >
                            <FiCheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        
                        {session?.user?.role === 'ADMIN' && doc.status === 'PENDING' && (
                          <button
                            onClick={() => handleApproveDocument(doc.id, false)}
                            className="text-red-600 hover:text-red-900 cursor-pointer"
                            title="Từ chối"
                          >
                            <FiXCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Không có tài liệu nào. Hãy tạo tài liệu mới.
          </div>
        )}

        {/* Pagination */}
        {totalItems > 0 && (
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
                  className="block w-16 py-2 px-2 border border-gray-300 bg-white rounded-md shadow-sm outline-none text-sm"
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
        )}
      </div>

      {/* FAB for adding documents on mobile */}
      <div className="sm:hidden fixed bottom-6 right-6 z-10">
        <Link href="/manager/documents/upload">
          <button className="flex items-center justify-center w-14 h-14 rounded-full bg-orange-600 text-white shadow-lg hover:bg-orange-700 outline-none transition-colors duration-200">
            <FiPlus className="h-6 w-6" />
          </button>
        </Link>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedDocument && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDeleteDocument}
          title="Xóa tài liệu"
          message={`Bạn có chắc chắn muốn xóa tài liệu "${selectedDocument.title}" không? Hành động này không thể hoàn tác.`}
        />
      )}
    </div>
  );
}