'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiSearch, FiChevronLeft, FiChevronRight, FiX, FiEdit2, FiTrash2, FiFilter } from 'react-icons/fi';
import DepartmentCreateModal from '@/components/departments/DepartmentCreateModal';
import DepartmentEditModal from '@/components/departments/DepartmentEditModal';
import DeleteConfirmModal from '../../../components/common/DeleteConfirmModal';
import toast from 'react-hot-toast';
import { MdOutlineCorporateFare } from 'react-icons/md';

interface Department {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
  };
  employeeCount?: number;
}

export default function DepartmentManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [employeeCountFilter, setEmployeeCountFilter] = useState<string>('');

  // Create refs for search inputs
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Search debounce
  const [searchDebounceTimeout, setSearchDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

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

  // Add auto-focus effect after component mounts
  useEffect(() => {
    // Focus the search input based on viewport size only on initial load
    const focusSearchInput = () => {
      // Only focus if user explicitly enabled this feature
      // Removing auto-focus behavior entirely
      return;
      
      // Previous focus code (disabled)
      /*
      if (window.innerWidth >= 640) { // sm breakpoint in Tailwind is 640px
        desktopSearchInputRef.current?.focus();
      } else {
        mobileSearchInputRef.current?.focus();
      }
      */
    };
    
    // Don't focus immediately to avoid transition issues
    const timer = setTimeout(() => {
      if (!loading) {
        focusSearchInput();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    // Chỉ cho phép quản trị viên truy cập trang này
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard');
      } else {
        if (departments.length === 0) {
          fetchDepartments();
        }
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  // Combine the effects for parameters that cause data refetching
  useEffect(() => {
    // Only fetch if authenticated and admin
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      // Don't fetch on initial load again (it's already done in first useEffect)
      if (departments.length !== 0 || currentPage !== 1 || 
          searchTerm !== '' || employeeCountFilter !== '') {
        // Clear existing timeout for search debounce
        if (searchDebounceTimeout) {
          clearTimeout(searchDebounceTimeout);
        }
        
        // Debounce for all parameter changes
        const timeout = setTimeout(() => {
          fetchDepartmentsForCurrentPage();
        }, 300);
        
        setSearchDebounceTimeout(timeout);
      }
    }
    
    return () => {
      if (searchDebounceTimeout) {
        clearTimeout(searchDebounceTimeout);
      }
    };
  }, [searchTerm, employeeCountFilter, currentPage, itemsPerPage, status, session?.user?.role]);

  const fetchDepartmentsForCurrentPage = async () => {
    try {
      setLoading(true);
      
      // Mocked API call (to be replaced with actual API call)
      // In production, you would send pagination and search parameters to your API
      const response = await fetch('/api/departments');
      const data = await response.json();
      
      // Map the data to include employeeCount from _count.users
      const mappedData = data.map((department: {
        id: string;
        name: string;
        description: string | null;
        createdAt: string;
        updatedAt: string;
        _count?: {
          users: number;
        };
      }) => ({
        ...department,
        employeeCount: department._count?.users || 0
      }));
      
      // Apply client-side filtering for search
      let filteredDepartments = [...mappedData];
      
      // Apply search filtering if needed
      if (searchTerm.trim()) {
        const searchTermLower = searchTerm.trim().toLowerCase();
        filteredDepartments = filteredDepartments.filter(department => 
          (department.name && department.name.toLowerCase().includes(searchTermLower)) || 
          (department.description && department.description.toLowerCase().includes(searchTermLower))
        );
      }
      
      // Apply employee count filtering if needed
      if (employeeCountFilter) {
        switch (employeeCountFilter) {
          case 'empty':
            filteredDepartments = filteredDepartments.filter(
              department => department.employeeCount === 0
            );
            break;
          case 'less5':
            filteredDepartments = filteredDepartments.filter(
              department => department.employeeCount > 0 && department.employeeCount < 5
            );
            break;
          case 'more5':
            filteredDepartments = filteredDepartments.filter(
              department => department.employeeCount >= 5
            );
            break;
        }
      }
      
      // Store the total count of filtered departments
      const totalCount = filteredDepartments.length;
      setTotalItems(totalCount);
      
      // Apply client-side pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, totalCount);
      const paginatedDepartments = filteredDepartments.slice(startIndex, endIndex);
      
      // Set the paginated departments
      setDepartments(paginatedDepartments);
      
    } catch (error) {
      console.error('Lỗi khi tải danh sách phòng ban:', error);
      toast.error('Không thể tải danh sách phòng ban');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    await fetchDepartmentsForCurrentPage();
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setIsEditModalOpen(true);
  };

  const handleDeleteDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteDepartment = async () => {
    if (!selectedDepartment) return;

    try {
      const response = await fetch(`/api/departments/${selectedDepartment.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchDepartments();
        setIsDeleteModalOpen(false);
        // Toast notification handled by DeleteConfirmModal
      } else {
        console.error('Lỗi khi xóa phòng ban');
        toast.error('Không thể xóa phòng ban');
      }
    } catch (error) {
      console.error('Lỗi khi xóa phòng ban:', error);
      toast.error('Xóa phòng ban thất bại');
    }
  };

  // Handle pagination change
  const handlePageChange = (newPage: number) => {
    // Prevent unnecessary re-fetching if the page is the same
    if (newPage === currentPage) return;
    
    // Update the page state which will trigger the fetchDepartmentsForCurrentPage effect
    setCurrentPage(newPage);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Add handlers to reset the page when search or filter changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPage(1); // Reset to first page when search changes
    setSearchTerm(e.target.value);
  };
  
  const handleEmployeeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentPage(1); // Reset to first page when filter changes
    setEmployeeCountFilter(e.target.value);
  };

  if (loading && departments.length === 0) {
    return (
      <div className="space-y-6">
        {/* No skeleton for search and filter section - removed as requested */}
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
                  placeholder="Tìm kiếm phòng ban..."
                  className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  disabled
                />
              </div>
              <button
                disabled
                className="flex items-center justify-center whitespace-nowrap bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-700 cursor-not-allowed opacity-70"
              >
                <FiFilter className="h-4 w-4 mr-1.5 text-gray-500" />
                <span>Bộ lọc</span>
              </button>
              <button
                disabled
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md opacity-70 cursor-not-allowed"
              >
                <FiPlus className="mr-2" /> Thêm phòng ban
              </button>
            </div>
          </div>
          
          {/* Mobile optimized search & utility bar */}
          <div className="sm:hidden">
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm phòng ban..."
                  className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  disabled
                />
              </div>
            </div>
            
            <div className="p-3 border-b border-gray-100">
              <button
                disabled
                className="flex items-center justify-center w-full py-2.5 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-700 opacity-70 cursor-not-allowed"
              >
                <FiFilter className="h-4 w-4 mr-2 text-gray-500" />
                <span>Bộ lọc</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Skeleton for department table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-5 w-5 bg-gray-200 rounded-md mr-2"></div>
              <div className="h-6 bg-gray-200 rounded-md w-40"></div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[...Array(5)].map((_, i) => (
                    <th key={i} scope="col" className="px-6 py-3 text-left">
                      <div className="h-4 bg-gray-200 rounded-md w-20"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-gray-200 rounded-md w-8 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 bg-gray-200 rounded-md w-32 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded-md w-40 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded-md w-10 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-3">
                        <div className="h-5 w-5 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="h-5 w-5 bg-gray-200 rounded-md animate-pulse"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Skeleton for pagination */}
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <div className="h-5 bg-gray-200 rounded-md w-60 animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-9 bg-gray-200 rounded-md w-28 animate-pulse"></div>
                <div className="h-9 bg-gray-200 rounded-md w-52 animate-pulse"></div>
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
                placeholder="Tìm kiếm phòng ban..."
                className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                value={searchTerm}
                onChange={handleSearchChange}
                ref={desktopSearchInputRef}
              />
              {searchTerm && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-center whitespace-nowrap bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <FiFilter className="h-4 w-4 mr-1.5 text-gray-500" />
              <span>Bộ lọc</span>
              {employeeCountFilter && (
                <span className="ml-1.5 flex items-center justify-center bg-orange-500 text-white text-xs rounded-full w-5 h-5 font-medium">
                  1
                </span>
              )}
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors duration-200 cursor-pointer"
            >
              <FiPlus className="mr-2" /> Thêm phòng ban
            </button>
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
                placeholder="Tìm kiếm phòng ban..."
                className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all
                "
                value={searchTerm}
                onChange={handleSearchChange}
                ref={mobileSearchInputRef}
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
          
          {/* Filter button only on mobile */}
          <div className="p-3 border-b border-gray-100">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-center w-full py-2.5 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FiFilter className="h-4 w-4 mr-2 text-gray-500" />
              <span>Bộ lọc</span>
              {employeeCountFilter && (
                <span className="ml-1.5 flex items-center justify-center bg-orange-500 text-white text-xs rounded-full w-5 h-5 font-medium">
                  1
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active filters display */}
        {employeeCountFilter && (
          <div className="px-4 py-2 bg-gray-50 flex flex-wrap items-center gap-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 mr-0.5">Bộ lọc:</span>
            <div className="inline-flex items-center bg-orange-50 text-orange-700 rounded-full text-xs px-2.5 py-1">
              <span className="mr-1 font-medium">Nhân viên: {
                employeeCountFilter === 'empty' ? 'Không có nhân viên' :
                employeeCountFilter === 'less5' ? 'Ít hơn 5' :
                employeeCountFilter === 'more5' ? 'Nhiều hơn 5' : 
                'Tất cả'
              }</span>
              <button 
                onClick={() => setEmployeeCountFilter('')}
                className="text-orange-500 hover:text-orange-700 cursor-pointer"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={() => setEmployeeCountFilter('')}
              className="text-xs text-gray-500 hover:text-gray-700 ml-auto cursor-pointer"
            >
              Xóa tất cả
            </button>
          </div>
        )}

        {/* Filter dropdown panel - always in the DOM, toggled with classes */}
        <div className={`border-gray-100 bg-gray-50 filter-panel ${isFilterOpen ? 'open border-b' : ''}`}>
          <div className="px-4">
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Số lượng nhân viên</label>
                <select
                  value={employeeCountFilter}
                  onChange={handleEmployeeFilterChange}
                  className="block w-full rounded-md border border-gray-300 py-2.5 px-3 bg-white text-gray-700 text-sm cursor-pointer"
                  disabled={!isFilterOpen}
                >
                  <option value="">Tất cả</option>
                  <option value="empty">Không có nhân viên</option>
                  <option value="less5">Ít hơn 5 nhân viên</option>
                  <option value="more5">Nhiều hơn 5 nhân viên</option>
                </select>
              </div>
            </div>
            
            {/* Close/Clear buttons */}
            <div className="flex items-center mt-4 gap-2">
              <button
                onClick={() => {
                  setIsFilterOpen(false);
                }}
                className="flex-1 bg-orange-600 text-white rounded-md py-2.5 px-4 text-sm font-medium hover:bg-orange-700 cursor-pointer"
              >
                Đóng
              </button>
              {employeeCountFilter && (
                <button
                  onClick={() => {
                    setEmployeeCountFilter('');
                  }}
                  className="py-2.5 px-4 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Department table section */}
      <div className="bg-white shadow rounded-lg overflow-hidden relative">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <MdOutlineCorporateFare className="mr-2 h-5 w-5 text-gray-500" />
            Danh sách phòng ban
          </h2>
        </div>
        
        {/* Replace the existing loading overlay with skeleton display */}
        {loading && departments.length > 0 && (
          <div className="absolute inset-0 bg-white/80 z-10">
            <div className="overflow-x-auto h-full">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    {[...Array(5)].map((_, i) => (
                      <th key={i} scope="col" className="px-6 py-3 text-left">
                        <div className="h-4 bg-gray-200 animate-pulse rounded-md w-20"></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...Array(departments.length || 5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-gray-200 animate-pulse rounded-md w-8"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 bg-gray-200 animate-pulse rounded-md w-32"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 animate-pulse rounded-md w-40"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 animate-pulse rounded-md w-10"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-3">
                          <div className="h-5 w-5 bg-gray-200 animate-pulse rounded-md"></div>
                          <div className="h-5 w-5 bg-gray-200 animate-pulse rounded-md"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STT
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên phòng ban
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số lượng nhân viên
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departments.length > 0 ? (
                departments.map((department, index) => (
                  <tr key={department.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{department.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{department.description || '--'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{department.employeeCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEditDepartment(department)}
                          className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <FiEdit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(department)}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                          title="Xóa"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Không tìm thấy phòng ban nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 sm:px-6"> 
          <div className="mb-4 sm:mb-0">
            <p className="text-sm text-gray-700">
              Hiển thị{' '}
              <span className="font-medium">
                {departments.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
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

      {/* Floating Add Button (Mobile only) */}
      <div className="sm:hidden fixed bottom-6 right-6 z-10">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-orange-600 text-white shadow-lg hover:bg-orange-700 transition-colors duration-200"
        >
          <FiPlus className="h-6 w-6" />
        </button>
      </div>

      {/* Modals */}
      <DepartmentCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onDepartmentCreated={fetchDepartments}
      />

      {selectedDepartment && (
        <DepartmentEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedDepartment(null);
          }}
          onDepartmentUpdated={fetchDepartments}
          department={selectedDepartment}
        />
      )}

      {selectedDepartment && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedDepartment(null);
          }}
          onConfirm={confirmDeleteDepartment}
          title="Xóa phòng ban"
          message={`Bạn có chắc chắn muốn xóa phòng ban "${selectedDepartment.name}" không? Hành động này không thể hoàn tác.`}
        />
      )}
    </div>
  );
} 