'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave, FiTrash } from 'react-icons/fi';
import toast from 'react-hot-toast';

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
  const id = params.id as string;
  
  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Categories for documents
  const categories = [
    { value: 'REPORT', label: 'Báo cáo' },
    { value: 'CONTRACT', label: 'Hợp đồng' },
    { value: 'GUIDE', label: 'Hướng dẫn' },
    { value: 'FORM', label: 'Biểu mẫu' },
    { value: 'OTHER', label: 'Khác' }
  ];

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard');
        toast.error('Bạn không có quyền truy cập trang này');
      } else {
        fetchDocument();
        fetchDepartments();
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  const fetchDocument = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/documents/${id}`);
      
      if (response.status === 404) {
        toast.error('Không tìm thấy tài liệu');
        router.push('/admin/content-review/documents');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }
      
      const documentData = await response.json();
      setDocument(documentData);
      
      // Set form values
      setTitle(documentData.title);
      setDescription(documentData.description || '');
      setCategory(documentData.category);
      setDepartmentId(documentData.departmentId || '');
    } catch (error) {
      console.error('Error loading document:', error);
      toast.error('Đã xảy ra lỗi khi tải tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      
      const departmentsData = await response.json();
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error('Đã xảy ra lỗi khi tải danh sách phòng ban');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề tài liệu');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description: description || null,
          category,
          departmentId: departmentId || null
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update document');
      }
      
      toast.success('Cập nhật tài liệu thành công');
      router.push('/admin/content-review/documents');
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Đã xảy ra lỗi khi cập nhật tài liệu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!document) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      toast.success('Xóa tài liệu thành công');
      router.push('/admin/content-review/documents');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Đã xảy ra lỗi khi xóa tài liệu');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Back button skeleton */}
        <div>
          <div className="inline-flex h-10 w-40 rounded-md bg-gray-200 animate-pulse"></div>
        </div>

        {/* Form skeleton */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            {/* Title skeleton */}
            <div className="h-8 w-3/4 bg-gray-200 rounded-md mb-6 animate-pulse"></div>
            
            <div className="space-y-6">
              {/* Title input skeleton */}
              <div>
                <div className="h-5 w-1/4 bg-gray-200 rounded-md mb-2 animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
              </div>
              
              {/* Description input skeleton */}
              <div>
                <div className="h-5 w-1/4 bg-gray-200 rounded-md mb-2 animate-pulse"></div>
                <div className="h-28 w-full bg-gray-200 rounded-md animate-pulse"></div>
              </div>
              
              {/* Category input skeleton */}
              <div>
                <div className="h-5 w-1/4 bg-gray-200 rounded-md mb-2 animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
              </div>
              
              {/* Department input skeleton */}
              <div>
                <div className="h-5 w-1/4 bg-gray-200 rounded-md mb-2 animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
              </div>
              
              {/* Buttons skeleton */}
              <div className="flex justify-end pt-5 space-x-3">
                <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Không tìm thấy tài liệu</h2>
        <p className="mt-2 text-gray-600">Tài liệu không tồn tại hoặc đã bị xóa.</p>
        <div className="mt-6">
          <Link
            href="/admin/content-review/documents"
            className="inline-flex items-center text-md font-medium text-orange-600 hover:text-orange-700 focus:outline-none cursor-pointer"
          >
            <FiArrowLeft className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Quay lại danh sách tài liệu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/admin/content-review/documents"
          className="inline-flex items-center text-md font-medium text-orange-600 hover:text-orange-700 focus:outline-none cursor-pointer"
        >
          <FiArrowLeft className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Quay lại danh sách tài liệu
        </Link>
      </div>

      {/* Edit form */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Chỉnh sửa tài liệu</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Mô tả
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Phân loại <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
                required
              >
                <option value="" disabled>Chọn phân loại</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Phòng ban
              </label>
              <select
                id="department"
                name="department"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
              >
                <option value="">Không có phòng ban</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end pt-5 space-x-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
              >
                <FiTrash className="-ml-1 mr-2 h-5 w-5" />
                Xóa tài liệu
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <FiSave className="-ml-1 mr-2 h-5 w-5" />
                {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition duration-150 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiTrash className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Xóa tài liệu
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {deleting ? 'Đang xóa...' : 'Xóa'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleting}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:cursor-not-allowed cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 