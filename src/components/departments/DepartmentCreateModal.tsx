'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiX, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { MdOutlineCorporateFare } from 'react-icons/md';

interface DepartmentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepartmentCreated: () => void;
}

interface DepartmentCreateInput {
  name: string;
  description: string | null;
}

export default function DepartmentCreateModal({
  isOpen,
  onClose,
  onDepartmentCreated
}: DepartmentCreateModalProps) {
  const [formData, setFormData] = useState<DepartmentCreateInput>({
    name: '',
    description: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [validationFailed, setValidationFailed] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      errors.name = 'Tên phòng ban không được để trống';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setValidationFailed(true);
      return;
    }
    
    setIsLoading(true);
    setError('');
    setValidationFailed(false);
    
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description ? formData.description.trim() : null,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Không thể tạo phòng ban');
      }
      
      // Hiển thị toast thành công
      toast.success('Đã tạo phòng ban mới thành công!');
      
      // Reset form
      setFormData({
        name: '',
        description: null
      });
      
      // Close modal and refresh departments list
      onClose();
      onDepartmentCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tạo phòng ban');
    } finally {
      setIsLoading(false);
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
          
          <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-lg mx-2 sm:mx-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 bg-white">
              <Dialog.Title as="h3" className="text-lg sm:text-xl font-medium text-gray-900 flex items-center">
                <MdOutlineCorporateFare className="mr-2 text-orange-500 text-xl sm:text-2xl" />
                Thêm phòng ban mới
              </Dialog.Title>
              <button
                type="button"
                className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer p-1"
                onClick={onClose}
                disabled={isLoading}
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
                        Tên phòng ban <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MdOutlineCorporateFare className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={formData.name || ''}
                          onChange={handleInputChange}
                          className="pl-10 block w-full border border-gray-300 rounded-md py-2.5 sm:py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-base sm:text-sm bg-white text-black"
                          disabled={isLoading}
                          required
                        />
                      </div>
                      {formErrors.name && (
                        <p className="mt-1 text-sm sm:text-base text-red-600">{formErrors.name}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm sm:text-base font-medium text-gray-700">
                        Mô tả
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                          <FiFileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <textarea
                          name="description"
                          id="description"
                          rows={3}
                          value={formData.description || ''}
                          onChange={handleInputChange}
                          className="pl-10 block w-full border border-gray-300 rounded-md py-2.5 sm:py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-base sm:text-sm bg-white text-black"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex justify-center items-center gap-2 rounded-md border border-transparent px-5 py-2.5 sm:py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang xử lý...
                      </>
                    ) : (
                      'Tạo phòng ban'
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 px-5 py-2.5 sm:py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm cursor-pointer"
                    onClick={onClose}
                    disabled={isLoading}
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