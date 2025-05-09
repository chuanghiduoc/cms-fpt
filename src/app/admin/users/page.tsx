'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiSearch, FiFilter, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import UserEditModal from '@/components/users/UserEditModal';
import UserCreateModal from '@/components/users/UserCreateModal';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import UserTable from '@/components/users/UserTable';
import { User, Department } from '@/types/user';

export default function UserManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [departmentNames, setDepartmentNames] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Filter state
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [searchDebounceTimeout, setSearchDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

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
    // Chỉ cho phép quản trị viên truy cập trang này
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard');
      } else {
        // Fetch departments first
        fetchDepartments();
        // Initial fetch of users only if first load
        if (users.length === 0 && currentPage === 1 && !searchTerm && !selectedDepartmentId && !selectedRole) {
          fetchUsersForCurrentPage();
          setIsInitialLoading(false);
        }
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session]);

  // Effect for handling pagination and filtering changes
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN' && !isInitialLoading) {
      if (users.length !== 0 || currentPage !== 1 || 
          searchTerm !== '' || selectedDepartmentId !== '' || selectedRole !== '') {
        fetchUsersForCurrentPage();
      }
    }
  }, [currentPage, itemsPerPage, selectedDepartmentId, selectedRole, isInitialLoading]);

  // Apply search term filtering with debounce
  useEffect(() => {
    // Clear existing timeout
    if (searchDebounceTimeout) {
      clearTimeout(searchDebounceTimeout);
    }

    // Set a new timeout to debounce the search
    const timeout = setTimeout(() => {
      if (status === 'authenticated' && session?.user?.role === 'ADMIN' && !isInitialLoading) {
        if (searchTerm.trim() !== '') {
          // Reset to first page when search term changes
          setCurrentPage(1);
          fetchUsersForCurrentPage();
        }
      }
    }, 300); // 300ms debounce delay

    setSearchDebounceTimeout(timeout);

    // Cleanup function to clear timeout if component unmounts or search term changes again
    return () => {
      if (searchDebounceTimeout) {
        clearTimeout(searchDebounceTimeout);
      }
    };
  }, [searchTerm, isInitialLoading]);

  const fetchUsersForCurrentPage = async () => {
    try {
      setLoading(true);
      
      // Create query params for API request
      const params = new URLSearchParams();
      
      // Add department filter if selected
      if (selectedDepartmentId) {
        params.append('departmentId', selectedDepartmentId);
      }

      // Add role filter if selected
      if (selectedRole) {
        params.append('role', selectedRole);
      }

      // Add search term if present
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      console.log(`Fetching users with search: "${searchTerm.trim()}", department: ${selectedDepartmentId}, role: ${selectedRole}`);
      
      // First, fetch all users to allow client-side filtering
      const response = await fetch('/api/users');
      const data = await response.json();
      
      // Get all users from the response
      let allUsers: User[] = [];
      if ('users' in data && Array.isArray(data.users)) {
        allUsers = data.users;
      } else if (Array.isArray(data)) {
        allUsers = data;
      }
      
      // Apply client-side filtering for search and department
      let filteredUsers = [...allUsers];
      
      // Apply department filtering if needed
      if (selectedDepartmentId) {
        filteredUsers = filteredUsers.filter(user => 
          user.departmentId === selectedDepartmentId || 
          user.department?.id === selectedDepartmentId
        );
      }
      
      // Apply role filtering if needed
      if (selectedRole) {
        filteredUsers = filteredUsers.filter(user => user.role === selectedRole);
      }
      
      // Apply search filtering if needed
      if (searchTerm.trim()) {
        const searchTermLower = searchTerm.trim().toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          (user.name && user.name.toLowerCase().includes(searchTermLower)) || 
          (user.email && user.email.toLowerCase().includes(searchTermLower)) ||
          (user.department?.name && user.department.name.toLowerCase().includes(searchTermLower))
        );
      }
      
      // Store the total count of filtered users
      const totalCount = filteredUsers.length;
      setTotalItems(totalCount);
      
      // Apply client-side pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, totalCount);
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      
      // Set the paginated users
      setUsers(paginatedUsers);
      
      console.log(`Search results: ${filteredUsers.length} users found. Showing ${paginatedUsers.length} users (${startIndex + 1}-${endIndex})`);
      
    } catch (error) {
      console.error('Lỗi khi tải danh sách người dùng:', error);
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  };

  const fetchUsers = async () => {
    await fetchUsersForCurrentPage();
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      const data = await response.json();
      
      // Set departments for filter dropdown
      setDepartments(data);
      
      // Create a map of department IDs to names
      const departmentMap: Record<string, string> = {};
      data.forEach((dept: { id: string; name: string }) => {
        departmentMap[dept.id] = dept.name;
      });
      
      setDepartmentNames(departmentMap);
    } catch (error) {
      console.error('Lỗi khi tải danh sách phòng ban:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUsers();
        setIsDeleteModalOpen(false);
      } else {
        console.error('Lỗi khi xóa người dùng');
      }
    } catch (error) {
      console.error('Lỗi khi xóa người dùng:', error);
    }
  };

  // Handle pagination change - now only updates the state without full page reload
  const handlePageChange = (newPage: number) => {
    // Prevent unnecessary re-fetching if the page is the same
    if (newPage === currentPage) return;
    
    // Update the page state which will trigger the fetchUsersForCurrentPage effect
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

  // Handle filter changes
  const handleDepartmentFilterChange = (departmentId: string) => {
    if (departmentId !== selectedDepartmentId) {
      setSelectedDepartmentId(departmentId);
      setCurrentPage(1); // Reset to first page when filter changes
      // fetchUsersForCurrentPage will be triggered by the useEffect
    }
  };

  const handleRoleFilterChange = (role: string) => {
    if (role !== selectedRole) {
      setSelectedRole(role);
      setCurrentPage(1); // Reset to first page when filter changes
      // fetchUsersForCurrentPage will be triggered by the useEffect
    }
  };

  // Handle select changes without closing the filter panel
  const handleSelectChange = (type: 'department' | 'role', value: string) => {
    if (type === 'department') {
      handleDepartmentFilterChange(value);
    } else {
      handleRoleFilterChange(value);
    }
    // Don't close the filter panel
  };

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only handle clicks outside when the filter dropdown is open
      // and the click wasn't inside a select or option element
      const target = event.target as Element;
      const isSelectElement = target.tagName.toLowerCase() === 'select' || 
                             target.tagName.toLowerCase() === 'option';
      
      if (isFilterOpen && 
          !isSelectElement && 
          !target.closest('select') && 
          !target.closest('.filter-dropdown') && 
          !target.closest('.filter-panel')) {
        setIsFilterOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị viên';
      case 'DEPARTMENT_HEAD':
        return 'Trưởng phòng';
      case 'EMPLOYEE':
        return 'Nhân viên';
      default:
        return role;
    }
  };

  if (isInitialLoading || (loading && users.length === 0)) {
    return (
      <div className="space-y-6 relative pb-16 sm:pb-0">
        {/* Search and filter section - No skeleton here */}
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
                  placeholder="Tìm kiếm người dùng..."
                  className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all
                  "
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
                <FiPlus className="mr-2" /> Thêm người dùng
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
                  placeholder="Tìm kiếm người dùng..."
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

        {/* Only show loading skeleton for the table section */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-7 w-48 bg-gray-200 rounded-md"></div>
          </div>
          
          {/* Skeleton table rows */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* Skeleton headers */}
                  {[...Array(5)].map((_, index) => (
                    <th key={index} className="px-6 py-3">
                      <div className="h-5 bg-gray-200 rounded-md w-20"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Skeleton rows */}
                {[...Array(5)].map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {/* User info cell */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                        <div className="ml-4 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-40"></div>
                        </div>
                      </div>
                    </td>
                    {/* Department cell */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    {/* Role cell */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-200 rounded w-24"></div>
                    </td>
                    {/* Status cell */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                    </td>
                    {/* Actions cell */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Skeleton pagination */}
          <div className="bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 sm:px-6">
            <div className="h-5 bg-gray-200 rounded w-48 mb-4 sm:mb-0"></div>
            <div className="flex justify-between">
              <div className="h-9 w-28 bg-gray-200 rounded mr-2"></div>
              <div className="h-9 w-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-16 sm:pb-0">
      {/* Search and filter section - No skeleton here */}
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
                placeholder="Tìm kiếm người dùng..."
                className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              {(selectedDepartmentId || selectedRole) && (
                <span className="ml-1.5 flex items-center justify-center bg-orange-500 text-white text-xs rounded-full w-5 h-5 font-medium">
                  {(selectedDepartmentId ? 1 : 0) + (selectedRole ? 1 : 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors duration-200 cursor-pointer"
            >
              <FiPlus className="mr-2" /> Thêm người dùng
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
                placeholder="Tìm kiếm người dùng..."
                className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
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
          
          {/* Filter button only on mobile */}
          <div className="p-3 border-b border-gray-100">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-center w-full py-2.5 px-3 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FiFilter className="h-4 w-4 mr-2 text-gray-500" />
              <span>Bộ lọc</span>
              {(selectedDepartmentId || selectedRole) && (
                <span className="ml-1.5 flex items-center justify-center bg-orange-500 text-white text-xs rounded-full w-5 h-5 font-medium">
                  {(selectedDepartmentId ? 1 : 0) + (selectedRole ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active filters display */}
        {(selectedDepartmentId || selectedRole) && (
          <div className="px-4 py-2 bg-gray-50 flex flex-wrap items-center gap-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 mr-0.5">Bộ lọc:</span>
            {selectedDepartmentId && (
              <div className="inline-flex items-center bg-orange-50 text-orange-700 rounded-full text-xs px-2.5 py-1">
                <span className="mr-1 font-medium">Phòng ban: {departmentNames[selectedDepartmentId] || 'Đã chọn'}</span>
                <button 
                  onClick={() => handleSelectChange('department', '')}
                  className="text-orange-500 hover:text-orange-700 cursor-pointer"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {selectedRole && (
              <div className="inline-flex items-center bg-orange-50 text-orange-700 rounded-full text-xs px-2.5 py-1">
                <span className="mr-1 font-medium">Vai trò: {getRoleDisplayName(selectedRole)}</span>
                <button 
                  onClick={() => handleSelectChange('role', '')}
                  className="text-orange-500 hover:text-orange-700 cursor-pointer"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <button
              onClick={() => {
                handleSelectChange('department', '');
                handleSelectChange('role', '');
              }}
              className="text-xs text-gray-500 hover:text-gray-700 ml-auto cursor-pointer"
            >
              Xóa tất cả
            </button>
          </div>
        )}

        {/* Filter dropdown panel - always in the DOM, toggled with classes */}
        <div className={`border-gray-100 bg-gray-50 filter-panel ${isFilterOpen ? 'open border-b' : ''}`}>
          <div className="px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Department filter */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Phòng ban</label>
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => handleSelectChange('department', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2.5 px-3 bg-white text-gray-700 text-sm cursor-pointer"
                  disabled={!isFilterOpen}
                >
                  <option value="">Tất cả phòng ban</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role filter */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Vai trò</label>
                <select
                  value={selectedRole}
                  onChange={(e) => handleSelectChange('role', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2.5 px-3 bg-white text-gray-700 text-sm cursor-pointer"
                  disabled={!isFilterOpen}
                >
                  <option value="">Tất cả vai trò</option>
                  {['ADMIN', 'DEPARTMENT_HEAD', 'EMPLOYEE'].map(role => (
                    <option key={role} value={role}>
                      {getRoleDisplayName(role)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Apply/Clear filters buttons */}
            <div className="flex items-center mt-4 gap-2">
              <button
                onClick={() => {
                  // Just close the filter panel
                  setIsFilterOpen(false);
                }}
                className="flex-1 bg-orange-600 text-white rounded-md py-2.5 px-4 text-sm font-medium hover:bg-orange-700 cursor-pointer"
              >
                Đóng
              </button>
              {(selectedDepartmentId || selectedRole) && (
                <button
                  onClick={() => {
                    handleSelectChange('department', '');
                    handleSelectChange('role', '');
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

      {/* Table section */}
      <div className="bg-white shadow rounded-lg overflow-hidden relative">
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <FiSearch className="mr-2 h-5 w-5 text-gray-500" />
            Danh sách người dùng
          </h2>
        </div>
        
        {loading && !isInitialLoading && (
          <div className="absolute inset-0 bg-white/80 z-10 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        )}

        {/* Show the actual user table */}
        <UserTable 
          users={users}
          currentUserId={session?.user?.id}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          departmentNames={departmentNames}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
        />
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 sm:px-6"> 
          <div className="mb-4 sm:mb-0">
            <p className="text-sm text-gray-700">
              Hiển thị{' '}
              <span className="font-medium">
                {users.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
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

      {/* FAB for adding users on mobile */}
      <div className="sm:hidden fixed bottom-6 right-6 z-10">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-orange-600 text-white shadow-lg hover:bg-orange-700 transition-colors duration-200"
        >
          <FiPlus className="h-6 w-6" />
        </button>
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <UserCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onUserCreated={fetchUsers}
        />
      )}

      {isEditModalOpen && selectedUser && (
        <UserEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={selectedUser}
          onUserUpdated={fetchUsers}
        />
      )}

      {isDeleteModalOpen && selectedUser && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDeleteUser}
          title="Xóa người dùng"
          message={`Bạn có chắc chắn muốn xóa người dùng "${selectedUser.name}" không? Hành động này không thể hoàn tác.`}
        />
      )}
    </div>
  );
} 