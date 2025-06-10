'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiUpload, FiFileText, FiX, FiInfo, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Department {
  id: string;
  name: string;
}

export default function UploadDocumentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [departmentId, setDepartmentId] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Document categories from the schema
  const documentCategories = [
    { value: 'REPORT', label: 'Báo cáo' },
    { value: 'CONTRACT', label: 'Hợp đồng' },
    { value: 'GUIDE', label: 'Hướng dẫn' },
    { value: 'FORM', label: 'Biểu mẫu' },
    { value: 'OTHER', label: 'Khác' }
  ];

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'DEPARTMENT_HEAD' && session?.user?.role !== 'ADMIN') {
        router.push('/dashboard');
        toast.error('Bạn không có quyền truy cập trang này');
      } else {
        // If user is a department head, set the default department to their department
        if (session.user.role === 'DEPARTMENT_HEAD') {
          setDepartmentId(session.user.department || '');
        }
        
        fetchDepartments();
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/departments');
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error('Không thể tải danh sách phòng ban');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Set errors
      validateField('file', selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    
    // Clear error
    const newErrors = { ...errors };
    delete newErrors.file;
    setErrors(newErrors);
  };

  const validateField = (field: string, value: unknown) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'title':
        if (typeof value === 'string') {
          if (!value.trim()) {
            newErrors.title = 'Tiêu đề là bắt buộc';
          } else if (value.length > 100) {
            newErrors.title = 'Tiêu đề không được vượt quá 100 ký tự';
          } else {
            delete newErrors.title;
          }
        }
        break;
      case 'file':
        if (value instanceof File) {
          if (value.size > 10 * 1024 * 1024) { // 10MB limit
            newErrors.file = 'Kích thước tệp tin không được vượt quá 10MB';
          } else {
            delete newErrors.file;
          }
        } else if (value === null) {
          newErrors.file = 'Tệp tin là bắt buộc';
        }
        break;
      case 'description':
        if (typeof value === 'string' && value.length > 500) {
          newErrors.description = 'Mô tả không được vượt quá 500 ký tự';
        } else {
          delete newErrors.description;
        }
        break;
      case 'departmentId':
        if ((!value || (typeof value === 'string' && !value.trim())) && session?.user?.role === 'ADMIN') {
          newErrors.departmentId = 'Phòng ban là bắt buộc';
        } else {
          delete newErrors.departmentId;
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    validateField('title', title);
    validateField('file', file);
    validateField('description', description);
    validateField('departmentId', departmentId);
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!file) {
      toast.error('Vui lòng chọn tệp tin để tải lên');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // First upload the file
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error('File upload failed');
      }
      
      const uploadData = await uploadResponse.json();
      
      if (!uploadData.success) {
        throw new Error(uploadData.error || 'File upload failed');
      }
      
      // Then create the document record with the file information
      const documentResponse = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          category,
          filePath: uploadData.file.fileUrl,
          departmentId: departmentId || null,
          isPublic,
        }),
      });
      
      if (!documentResponse.ok) {
        throw new Error('Failed to create document record');
      }
      
      toast.success('Tài liệu đã được tải lên thành công');
      router.push('/manager/documents');
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Đã xảy ra lỗi khi tải lên tài liệu');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
      <div>
        <Link 
          href="/company/posts"
          className="inline-flex items-center text-orange-600 hover:text-orange-800 font-medium"
        >
          <FiArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách bài viết
        </Link>
      </div>
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden p-6">
          <div className="space-y-6 animate-pulse">
            {/* Title skeleton */}
            <div>
              <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
            
            {/* Description skeleton */}
            <div>
              <div className="h-5 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-24 bg-gray-200 rounded w-full"></div>
            </div>
            
            {/* Category skeleton */}
            <div>
              <div className="h-5 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
            
            {/* Department skeleton */}
            <div>
              <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
            
            {/* Visibility skeleton */}
            <div className="flex items-center">
              <div className="h-5 w-5 bg-gray-200 rounded mr-3"></div>
              <div>
                <div className="h-5 bg-gray-200 rounded w-20 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-64"></div>
              </div>
            </div>
            
            {/* File upload skeleton */}
            <div>
              <div className="h-5 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="mt-1 border-2 border-gray-200 border-dashed rounded-md p-6">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-56"></div>
                </div>
              </div>
            </div>
            
            {/* Buttons skeleton */}
            <div className="flex justify-end space-x-4 pt-4">
              <div className="h-10 bg-gray-200 rounded w-20"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
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
          <Link href="/manager/documents" className="mr-4 text-gray-500 hover:text-gray-700">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            Tải lên tài liệu mới
          </h1>
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Tiêu đề: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                validateField('title', e.target.value);
              }}
              className={`mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150`}
              placeholder="Nhập tiêu đề tài liệu"
              required
            />
            {errors.title && (
              <p className="mt-2 text-sm text-red-600">{errors.title}</p>
            )}
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Mô tả:
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                validateField('description', e.target.value);
              }}
              className={`mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150`}
              placeholder="Nhập mô tả về tài liệu (tùy chọn)"
            />
            {errors.description && (
              <p className="mt-2 text-sm text-red-600">{errors.description}</p>
            )}
          </div>
          
          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Phân loại:
            </label>
            <select
              id="category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
            >
              {documentCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">
              Phòng ban: {session?.user?.role === 'ADMIN' && <span className="text-red-500">*</span>}
            </label>
            <select
              id="department"
              name="department"
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                validateField('departmentId', e.target.value);
              }}
              disabled={session?.user?.role === 'DEPARTMENT_HEAD'}
                className={`mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150 ${
                session?.user?.role === 'DEPARTMENT_HEAD' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <option value="" className="bg-gray-100 text-gray-600">Chọn phòng ban</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {errors.departmentId && (
              <p className="mt-2 text-sm text-red-600">{errors.departmentId}</p>
            )}
          </div>
          
          {/* Visibility setting */}
          <div className="relative flex items-start">
            <div className="flex h-5 items-center">
              <input
                id="is-public"
                aria-describedby="is-public-description"
                name="is-public"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-orange-600 outline-none cursor-pointer"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="is-public" className="font-medium text-gray-700 cursor-pointer">
                Công khai
              </label>
              <p id="is-public-description" className="text-gray-500">
                {session?.user?.role === 'ADMIN' 
                  ? 'Tài liệu sẽ được công khai cho tất cả mọi người xem.'
                  : 'Đề xuất công khai tài liệu (cần được quản trị viên phê duyệt).'}
              </p>
            </div>
          </div>
          
          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tệp tin: <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              {!file ? (
                <div className="space-y-1 text-center">
                  <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-medium text-orange-600 hover:text-orange-500 outline-none"
                    >
                      <span>Tải lên tệp tin</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">hoặc kéo và thả</p>
                  </div>
                  <p className="text-xs text-gray-500">DOC, DOCX, PDF, XLS, XLSX, PPT, PPTX, JPG, PNG</p>
                </div>
              ) : (
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FiFileText className="h-8 w-8 text-gray-500" />
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="inline-flex items-center p-1.5 border border-transparent rounded-full text-white bg-red-600 hover:bg-red-700 outline-none cursor-pointer"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            {errors.file && (
              <p className="mt-2 text-sm text-red-600">{errors.file}</p>
            )}
          </div>
          
          {/* Note for department heads */}
          {session?.user?.role === 'DEPARTMENT_HEAD' && (
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiInfo className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3 flex-1 md:flex md:justify-between">
                  <p className="text-sm text-blue-700">
                    Tài liệu của bạn sẽ được gửi đến quản trị viên để kiểm duyệt trước khi được công khai.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Submit buttons */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/manager/documents"
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 outline-none cursor-pointer"
            >
              Hủy bỏ
            </Link>
            <button
              type="submit"
              disabled={isUploading}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 outline-none cursor-pointer ${
                isUploading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang tải lên...
                </>
              ) : (
                'Tải lên'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 