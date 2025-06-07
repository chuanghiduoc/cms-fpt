'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, 
  FiChevronLeft, 
  FiChevronRight, 
  FiFileText, 
  FiFilter, 
  FiX,
  FiDownload
} from 'react-icons/fi';
import toast from 'react-hot-toast';

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

export default function EmployeeDocumentsPage() {
  const { status } = useSession();
  const router = useRouter();
  
  // State for document management
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false); // Trạng thái loading riêng cho bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDebounceTimeout, setSearchDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Document categories from the schema with color mappings
  const documentCategories = [
    { value: 'REPORT', label: 'Báo cáo', bgClass: 'bg-blue-100', textClass: 'text-blue-800', borderClass: 'border-blue-200' },
    { value: 'CONTRACT', label: 'Hợp đồng', bgClass: 'bg-green-100', textClass: 'text-green-800', borderClass: 'border-green-200' },
    { value: 'GUIDE', label: 'Hướng dẫn', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800', borderClass: 'border-yellow-200' },
    { value: 'FORM', label: 'Biểu mẫu', bgClass: 'bg-purple-100', textClass: 'text-purple-800', borderClass: 'border-purple-200' },
    { value: 'OTHER', label: 'Khác', bgClass: 'bg-gray-100', textClass: 'text-gray-800', borderClass: 'border-gray-200' }
  ];

  // Add page transition animations
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  // Add animation variants like in events page
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
    if (status === 'authenticated') {
      fetchDocuments();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchDocuments = async () => {
    // Use a single loading mechanism to prevent double loading
    const isFirstLoad = documents.length === 0 && !filterLoading && loading;
    
    if (isFirstLoad) {
      setLoading(true);
    } else {
      setFilterLoading(true);
    }
    
    try {
      const searchParams = new URLSearchParams();
      if (searchTerm) {
        searchParams.append('search', searchTerm);
      }
      if (selectedCategory) {
        searchParams.append('category', selectedCategory);
      }
      // Sử dụng status APPROVED thay vì PUBLIC
      searchParams.append('status', 'APPROVED');
      searchParams.append('page', currentPage.toString());
      searchParams.append('limit', itemsPerPage.toString());
      searchParams.append('sort', 'createdAt:desc');
      
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
      setFilterLoading(false);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    // Don't perform search if component is still in initial loading
    if (loading) return;
    
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
    // Skip during initial load, as the first fetchDocuments is called in the auth effect
    if (status !== 'authenticated' || loading) return;
    
    // Skip if this is the initial render
    if (currentPage === 1 && itemsPerPage === 10 && selectedCategory === '' && documents.length === 0) return;
    
    fetchDocuments();
  }, [currentPage, itemsPerPage, selectedCategory]);

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
    return {
      bgClass: category ? category.bgClass : 'bg-gray-100',
      textClass: category ? category.textClass : 'text-gray-800',
      borderClass: category ? category.borderClass : 'border-gray-200'
    };
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
    if (category === selectedCategory) return; // Không thay đổi nếu chọn cùng mục
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Initial loading state - chỉ hiển thị spinner đơn giản khi trang tải lần đầu
  if (loading) {
    return (
      <motion.div 
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={{ duration: 0.3 }}
        className="space-y-6 relative pb-16 sm:pb-0"
      >
        {/* Search and filter section - thiết kế responsive tốt hơn */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white shadow rounded-lg overflow-hidden"
        >
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
                disabled={filterLoading}
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
          
          {/* Filter section skeleton */}
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Documents list with skeleton loading */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white shadow rounded-lg overflow-hidden"
        >
          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex items-center">
              <FiFileText className="h-5 w-5 text-orange-600 mr-2" />
              <h2 className="text-base font-medium text-gray-800">Danh sách tài liệu</h2>
            </div>
          </div>
          
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
                    Ngày tạo
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tải xuống
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Generate skeleton rows */}
                {Array(5).fill(0).map((_, index) => (
                  <motion.tr 
                    key={index} 
                    className="hover:bg-gray-50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <motion.div 
                          className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md" 
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <div className="ml-4 space-y-2 flex-1">
                          <motion.div 
                            className="h-4 bg-gray-200 rounded w-[180px]"
                            animate={{ opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
                          />
                          <motion.div 
                            className="h-3 bg-gray-100 rounded w-[120px]"
                            animate={{ opacity: [0.5, 0.7, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <motion.div 
                        className="h-6 bg-gray-200 rounded-full w-20"
                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <motion.div 
                        className="h-4 bg-gray-200 rounded w-28"
                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.25 }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <motion.div 
                        className="h-4 bg-gray-200 rounded w-24"
                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end">
                        <motion.div 
                          className="h-8 w-8 bg-gray-200 rounded-full"
                          animate={{ opacity: [0.5, 0.8, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.35 }}
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Skeleton pagination */}
          <motion.div 
            className="bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 sm:px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <div className="mb-4 sm:mb-0">
              <motion.div 
                className="h-5 bg-gray-200 rounded w-52"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <motion.div 
                  className="h-8 bg-gray-200 rounded w-36"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
                />
              </div>
            
              <div className="flex space-x-1">
                <motion.div 
                  className="h-9 w-9 bg-gray-200 rounded-md"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                />
                {Array(3).fill(0).map((_, index) => (
                  <motion.div 
                    key={index} 
                    className="h-9 w-10 bg-gray-200 rounded-md"
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.25 + (index * 0.1) }}
                  />
                ))}
                <motion.div 
                  className="h-9 w-9 bg-gray-200 rounded-md"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.55 }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  // Small loading indicator for when filters are applied
  const LoadingIndicator = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center"
    >
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full mr-2"
      ></motion.div>
      <span className="text-xs text-gray-500">Đang tải...</span>
    </motion.div>
  );

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.3 }}
      className="space-y-6 relative pb-16 sm:pb-0"
    >
      {/* Search and filter section - thiết kế responsive tốt hơn */}
      <motion.div 
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="bg-white shadow rounded-lg overflow-hidden"
      >
        {/* Search bar */}
        <div className="p-4 border-b border-gray-100">
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
              disabled={filterLoading}
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
                Phân loại tài liệu:
              </span>
              <div className="flex flex-wrap gap-2">
                <motion.button
                  variants={filterButtonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => handleCategoryFilterChange('')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    selectedCategory === ''
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  disabled={filterLoading}
                >
                  Tất cả
                </motion.button>
                {documentCategories.map((category) => (
                  <motion.button
                    key={category.value}
                    variants={filterButtonVariants}
                    initial="initial"
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => handleCategoryFilterChange(category.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                      selectedCategory === category.value
                        ? `${category.bgClass} ${category.textClass} ${category.borderClass}`
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    disabled={filterLoading}
                  >
                    {category.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Documents list */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white shadow rounded-lg overflow-hidden"
      >
        {/* Table header với tiêu đề bảng */}
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiFileText className="h-5 w-5 text-orange-600 mr-2" />
              <h2 className="text-base font-medium text-gray-800">Danh sách tài liệu</h2>
            </div>
            {filterLoading && <LoadingIndicator />}
          </div>
        </div>
        
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
                  Ngày tạo
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tải xuống
                </th>
              </tr>
            </thead>
            <motion.tbody 
              className={`bg-white divide-y divide-gray-200 ${filterLoading ? 'opacity-60' : ''}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-sm text-center text-gray-500">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center justify-center py-8"
                    >
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4"
                      >
                        <FiFileText className="h-10 w-10 text-gray-400" />
                      </motion.div>
                      <p className="text-gray-500 mb-6 text-center max-w-md">
                        {selectedCategory || searchTerm ? 
                          'Không tìm thấy tài liệu nào phù hợp với bộ lọc hiện tại.' : 
                          'Không có tài liệu nào được tìm thấy.'}
                      </p>
                      {(selectedCategory || searchTerm) && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleClearFilters}
                          className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors"
                        >
                          Xóa tất cả bộ lọc
                        </motion.button>
                      )}
                    </motion.div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {documents.map((doc, index) => (
                    <motion.tr 
                      key={doc.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ 
                        duration: 0.2,
                        delay: index * 0.05, // staggered animation
                      }}
                      whileHover={{ 
                        backgroundColor: 'rgba(249, 250, 251, 1)',
                        scale: 1.005,
                        transition: { duration: 0.1 }
                      }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-orange-100 rounded-md"
                          >
                            <FiFileText className="h-6 w-6 text-orange-600" />
                          </motion.div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                            {doc.description && (
                              <div className="text-sm text-gray-500 line-clamp-1">{doc.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <motion.span 
                          whileHover={{ scale: 1.05 }}
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getCategoryColor(doc.category).bgClass} ${getCategoryColor(doc.category).textClass} ${getCategoryColor(doc.category).borderClass}`}
                        >
                          {getCategoryName(doc.category)}
                        </motion.span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.department?.name || 'Không có phòng ban'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(doc.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center">
                          <motion.a 
                            whileHover={{ scale: 1.2, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            href={doc.filePath}
                            download
                            className="text-orange-600 hover:text-orange-900 p-1.5 rounded-full hover:bg-orange-50"
                            title="Tải xuống"
                          >
                            <FiDownload className="h-5 w-5" />
                          </motion.a>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </motion.tbody>
          </table>
        </div>

        {/* Pagination controls - cải thiện responsive */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 sm:px-6"
        >
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
                className="block w-16 py-2 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none text-sm"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                disabled={filterLoading}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
          
            <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={currentPage === 1 || filterLoading}
                onClick={() => handlePageChange(currentPage - 1)}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === 1 || filterLoading
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Previous</span>
                <FiChevronLeft className="h-5 w-5" />
              </motion.button>
              
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
                  <motion.button
                    key={pageNum}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={filterLoading}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === pageNum
                        ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    } ${filterLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {pageNum}
                  </motion.button>
                );
              })}
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={currentPage === totalPages || filterLoading}
                onClick={() => handlePageChange(currentPage + 1)}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === totalPages || filterLoading
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Next</span>
                <FiChevronRight className="h-5 w-5" />
              </motion.button>
            </nav>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
} 