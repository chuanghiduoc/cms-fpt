'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { FiFileText, FiInfo, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Department {
  id: string;
  name: string;
}

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

export default function EditDocumentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;
  
  // Form state
  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
        fetchDocument();
        fetchDepartments();
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router, documentId]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      
      if (response.status === 404) {
        toast.error('Không tìm thấy tài liệu');
        router.push('/manager/documents');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }
      
      const documentData = await response.json();
      
      setDocument(documentData);
      setTitle(documentData.title);
      setDescription(documentData.description || '');
      setCategory(documentData.category);
      setDepartmentId(documentData.departmentId || '');
      setIsPublic(documentData.isPublic);
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Đã xảy ra lỗi khi tải thông tin tài liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const validateField = (field: string, value: string | boolean | null) => {
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
      case 'description':
        if (typeof value === 'string' && value && value.length > 500) {
          newErrors.description = 'Mô tả không được vượt quá 500 ký tự';
        } else {
          delete newErrors.description;
        }
        break;
      case 'departmentId':
        if ((!value || value === '') && session?.user?.role === 'ADMIN') {
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
    validateField('description', description);
    validateField('departmentId', departmentId);
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          category,
          departmentId: departmentId || null,
          isPublic: session?.user?.role === 'ADMIN' ? isPublic : document?.isPublic,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update document');
      }
      
      toast.success('Cập nhật tài liệu thành công');
      router.push('/manager/documents');
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Đã xảy ra lỗi khi cập nhật tài liệu');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/manager/documents" className="mr-4 text-gray-500 hover:text-gray-700">
              <FiArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              {/* <FiFileText className="mr-2 h-6 w-6 text-orange-500" /> */}
              Chỉnh sửa tài liệu
            </h1>
          </div>
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
            
            {/* File skeleton */}
            <div>
              <div className="h-5 bg-gray-200 rounded w-28 mb-2"></div>
              <div className="p-3 bg-gray-100 rounded-md">
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 bg-gray-200 rounded"></div>
                  <div className="h-5 bg-gray-200 rounded w-48"></div>
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

  if (!document) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-gray-600">Không tìm thấy tài liệu</p>
        <Link href="/manager/documents" className="mt-4 inline-block text-orange-600 hover:text-orange-800 font-medium">
          Quay lại danh sách
        </Link>
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
            {/* <FiFileText className="mr-2 h-6 w-6 text-orange-500" /> */}
            Chỉnh sửa tài liệu
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
          
          {/* Visibility setting - only for admin */}
          {session?.user?.role === 'ADMIN' && (
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
                  Tài liệu sẽ được công khai cho tất cả mọi người xem.
                </p>
              </div>
            </div>
          )}
          
          {/* Current file info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tệp tin hiện tại:
            </label>
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
              <FiFileText className="h-6 w-6 text-gray-500" />
              <div>
                <a 
                  href={document.filePath} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-orange-600 hover:text-orange-800 cursor-pointer"
                >
                  {document.filePath.split('/').pop()}
                </a>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Để thay đổi tệp tin, vui lòng tải lên tài liệu mới.
            </p>
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
                    Thay đổi của bạn sẽ được lưu, nhưng trạng thái phê duyệt của tài liệu sẽ do quản trị viên quyết định.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Submit buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 outline-none cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 outline-none cursor-pointer ${
                isSaving ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 