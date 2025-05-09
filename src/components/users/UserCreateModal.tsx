'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiX, FiUser, FiMail, FiLock, FiUserCheck } from 'react-icons/fi';
import { UserCreateInput } from '@/types/user';
import { Department } from '@/types/user';
import toast from 'react-hot-toast';
import { MdOutlineCorporateFare } from 'react-icons/md';

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export default function UserCreateModal({
  isOpen,
  onClose,
  onUserCreated,
}: UserCreateModalProps) {
  const [formData, setFormData] = useState<UserCreateInput>({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    departmentId: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [validationFailed, setValidationFailed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      // Reset form when opening modal
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
        departmentId: '',
      });
      setFormErrors({});
      setError('');
    }
  }, [isOpen]);

  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      } else {
        console.error('Lỗi khi tải danh sách phòng ban');
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách phòng ban:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field when user changes it
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Tên người dùng không được để trống';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }
    
    if (!formData.password) {
      errors.password = 'Mật khẩu không được để trống';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (!formData.role) {
      errors.role = 'Vai trò không được để trống';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      setValidationFailed(true);
      return;
    }
    
    setLoading(true);
    setValidationFailed(false);

    try {
      // Chuẩn bị dữ liệu gửi lên
      const payload = {
        ...formData,
        departmentId: formData.departmentId || null, // Gửi null nếu department trống
      };

      // Gọi API
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi tạo người dùng');
      }

      // Thành công
      toast.success('Đã thêm người dùng mới thành công!');
      onUserCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tạo người dùng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="fixed z-50 inset-0 overflow-y-auto" 
        onClose={onClose}
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="flex items-center justify-center min-h-screen px-2 sm:px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>
          
          <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition duration-150 sm:my-8 sm:align-middle w-full max-w-lg mx-2 sm:mx-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 bg-white">
              <Dialog.Title as="h3" className="text-lg sm:text-xl font-medium text-gray-900 flex items-center">
                <FiUser className="mr-2 text-orange-500 text-xl sm:text-2xl" />
                Thêm người dùng mới
              </Dialog.Title>
              <button
                type="button"
                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer p-1"
                onClick={onClose}
              >
                <span className="sr-only">Đóng</span>
                <FiX className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
              </button>
            </div>
            
            <div className="max-h-[70vh] sm:max-h-[60vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <div className="px-4 sm:px-6 py-4 bg-white">
                  {error && (
                    <div className="mb-5 p-4 bg-red-50 border-l-4 border-red-400 rounded-md text-sm sm:text-base text-red-700">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p>{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {validationFailed && Object.keys(formErrors).length > 0 && (
                    <div className="mb-5 p-4 bg-red-50 border-l-4 border-red-400 rounded-md text-sm sm:text-base text-red-700">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p>Vui lòng kiểm tra lại thông tin nhập vào</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-5">
                    <div>
                      <label htmlFor="name" className="block text-sm sm:text-base font-medium text-gray-700">
                        Tên người dùng <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUser className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
                          required
                        />
                      </div>
                      {formErrors.name && (
                        <p className="mt-1 text-sm sm:text-base text-red-600">{formErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm sm:text-base font-medium text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
                          required
                        />
                      </div>
                      {formErrors.email && (
                        <p className="mt-1 text-sm sm:text-base text-red-600">{formErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm sm:text-base font-medium text-gray-700">
                        Mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          name="password"
                          id="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
                          required
                        />
                      </div>
                      {formErrors.password && (
                        <p className="mt-1 text-sm sm:text-base text-red-600">{formErrors.password}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="role" className="block text-sm sm:text-base font-medium text-gray-700">
                        Vai trò <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUserCheck className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150 cursor-pointer appearance-none"
                          required
                        >
                          <option value="EMPLOYEE">Nhân viên</option>
                          <option value="DEPARTMENT_HEAD">Trưởng phòng</option>
                          <option value="ADMIN">Quản trị viên</option>
                        </select>
                      </div>
                      {formErrors.role && (
                        <p className="mt-1 text-sm sm:text-base text-red-600">{formErrors.role}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="departmentId" className="block text-sm sm:text-base font-medium text-gray-700">
                        Phòng ban
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MdOutlineCorporateFare className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          id="departmentId"
                          name="departmentId"
                          value={formData.departmentId || ''}
                          onChange={handleChange}
                          className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150 cursor-pointer appearance-none"
                        >
                          <option value="">-- Chọn phòng ban --</option>
                          {loadingDepartments ? (
                            <option disabled>Đang tải...</option>
                          ) : (
                            departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center items-center gap-2 rounded-md border border-transparent px-5 py-2.5 sm:py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang xử lý...
                      </>
                    ) : (
                      'Thêm người dùng'
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 px-5 py-2.5 sm:py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm cursor-pointer"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 