'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiSave, FiArrowLeft, FiUser, FiCalendar, FiMapPin, FiClock, FiAlertCircle, FiLoader, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface DepartmentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function CreateEventPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    isPublic: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [departmentUsers, setDepartmentUsers] = useState<DepartmentUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Add search and pagination for participants
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 2;

  // Check authentication and role
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'DEPARTMENT_HEAD') {
        router.push('/dashboard');
        toast.error('Bạn không có quyền truy cập trang này');
      } else {
        // Set default dates
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        setFormData(prev => ({
          ...prev,
          startDate: today.toISOString().split('T')[0],
          endDate: tomorrow.toISOString().split('T')[0]
        }));
        
        // Fetch department users
        fetchDepartmentUsers();
      }
    }
  }, [status, session, router]);

  const fetchDepartmentUsers = async () => {
    try {
      if (!session?.user?.department) {
        return;
      }
      
      const response = await fetch(`/api/departments/${session.user.department}/users`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch department users');
      }
      
      const data = await response.json();
      setDepartmentUsers(data);
    } catch (error) {
      console.error('Error fetching department users:', error);
      toast.error('Đã xảy ra lỗi khi tải danh sách người dùng');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Tiêu đề không được để trống';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Mô tả không được để trống';
    }
    
    if (!formData.location.trim()) {
      errors.location = 'Địa điểm không được để trống';
    }
    
    if (!formData.startDate) {
      errors.startDate = 'Vui lòng chọn ngày bắt đầu';
    }
    
    if (!formData.endDate) {
      errors.endDate = 'Vui lòng chọn ngày kết thúc';
    }
    
    // Validate end date >= start date
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    
    if (endDateTime <= startDateTime) {
      errors.endDate = 'Thời gian kết thúc phải sau thời gian bắt đầu';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin sự kiện');
      return;
    }
    
    setLoading(true);
    
    try {
      // Format data for API
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      
      const eventData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        isPublic: false, // Department heads can only create events for their department
        departmentId: session?.user?.department
      };
      
      // Create event
      const eventResponse = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      
      if (!eventResponse.ok) {
        throw new Error('Failed to create event');
      }
      
      const event = await eventResponse.json();
      
      // Add participants if selected
      if (selectedUsers.length > 0) {
        const participantPromises = selectedUsers.map(userId => 
          fetch(`/api/events/${event.id}/participants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, status: 'pending' })
          })
        );
        
        await Promise.all(participantPromises);
      }
      
      toast.success('Đã tạo sự kiện thành công');
      router.push('/manager/events');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Đã xảy ra lỗi khi tạo sự kiện');
    } finally {
      setLoading(false);
    }
  };

  // Filtered users based on search term
  const filteredUsers = departmentUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginated users
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Change page
  const handlePageChange = (pageNumber: number, e: React.MouseEvent) => {
    // Prevent form submission when clicking pagination buttons
    e.preventDefault();
    setCurrentPage(pageNumber);
  };

  if (status === 'loading') {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-5 h-5 mr-4 bg-gray-200 rounded animate-pulse"></div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Tạo sự kiện mới
            </h1>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 space-y-6 animate-pulse">
            {/* Title skeleton */}
            <div>
              <div className="h-5 w-32 bg-gray-200 rounded mb-1"></div>
              <div className="h-10 w-full bg-gray-200 rounded"></div>
            </div>
            
            {/* Description skeleton */}
            <div>
              <div className="h-5 w-28 bg-gray-200 rounded mb-1"></div>
              <div className="h-24 w-full bg-gray-200 rounded"></div>
            </div>
            
            {/* Location skeleton */}
            <div>
              <div className="h-5 w-20 bg-gray-200 rounded mb-1"></div>
              <div className="h-10 w-full bg-gray-200 rounded"></div>
            </div>
            
            {/* Date & Time skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="h-5 w-32 bg-gray-200 rounded mb-1"></div>
                <div className="h-10 w-full bg-gray-200 rounded"></div>
              </div>
              <div>
                <div className="h-5 w-28 bg-gray-200 rounded mb-1"></div>
                <div className="h-10 w-full bg-gray-200 rounded"></div>
              </div>
              <div>
                <div className="h-5 w-32 bg-gray-200 rounded mb-1"></div>
                <div className="h-10 w-full bg-gray-200 rounded"></div>
              </div>
              <div>
                <div className="h-5 w-28 bg-gray-200 rounded mb-1"></div>
                <div className="h-10 w-full bg-gray-200 rounded"></div>
              </div>
            </div>
            
            {/* Participants skeleton */}
            <div>
              <div className="h-5 w-40 bg-gray-200 rounded mb-2"></div>
              <div className="h-10 w-full bg-gray-200 rounded mb-3"></div>
              <div className="h-40 w-full bg-gray-200 rounded"></div>
            </div>
            
            {/* Buttons skeleton */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <div className="h-10 w-20 bg-gray-200 rounded"></div>
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 text-gray-500 hover:text-gray-700 cursor-pointer"
            aria-label="Quay lại"
          >
            <FiArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Tạo sự kiện mới
          </h1>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề sự kiện <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150`}
              placeholder="Nhập tiêu đề sự kiện"
            />
            {formErrors.title && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <FiAlertCircle className="mr-1" /> {formErrors.title}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả sự kiện <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150`}
              placeholder="Nhập mô tả sự kiện"
            />
            {formErrors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <FiAlertCircle className="mr-1" /> {formErrors.description}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Địa điểm <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMapPin className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`block w-full pl-9 rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150`}
                placeholder="Ví dụ: Phòng họp A - Tầng 3"
              />
            </div>
            {formErrors.location && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <FiAlertCircle className="mr-1" /> {formErrors.location}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`block w-full pl-9 rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                />
              </div>
              {formErrors.startDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1" /> {formErrors.startDate}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                Giờ bắt đầu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiClock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="block w-full pl-9 rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className={`block w-full pl-9 rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                />
              </div>
              {formErrors.endDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1" /> {formErrors.endDate}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                Giờ kết thúc <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiClock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="block w-full pl-9 rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
            </div>
          </div>
          
          {/* Participant selection */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2 flex items-center">
              <FiUser className="mr-2" /> Mời người tham gia
            </h3>
            
            {departmentUsers.length > 0 ? (
              <div>
                {/* Search input */}
                <div className="mb-3 relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm người dùng..."
                    className="pl-9 pr-4 py-2 w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-gray-400" />
                  </div>
                </div>
                
                {/* User list */}
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  {currentUsers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Không tìm thấy người dùng
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {currentUsers.map((user) => (
                        <div 
                          key={user.id} 
                          className="flex items-center py-3 px-4 hover:bg-gray-50 cursor-pointer transition duration-150"
                          onClick={() => toggleUserSelection(user.id)}
                        >
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                          <div className="flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              readOnly
                              className="h-4 w-4 text-orange-600 border-gray-300 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-3">
                    <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        type="button" 
                        onClick={(e) => handlePageChange(Math.max(1, currentPage - 1), e)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-1 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50 cursor-pointer'
                        }`}
                      >
                        <span className="sr-only">Trước</span>
                        &laquo;
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber: number;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNumber}
                            type="button"
                            onClick={(e) => handlePageChange(pageNumber, e)}
                            className={`relative inline-flex items-center px-3 py-1 border text-sm font-medium cursor-pointer ${
                              currentPage === pageNumber
                                ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      
                      <button
                        type="button"
                        onClick={(e) => handlePageChange(Math.min(totalPages, currentPage + 1), e)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-1 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50 cursor-pointer'
                        }`}
                      >
                        <span className="sr-only">Sau</span>
                        &raquo;
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 border border-gray-200 rounded-md p-4 flex items-center justify-center">
                Không có người dùng trong phòng ban
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 outline-none transition duration-150 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 outline-none transition duration-150 flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  Tạo sự kiện
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 