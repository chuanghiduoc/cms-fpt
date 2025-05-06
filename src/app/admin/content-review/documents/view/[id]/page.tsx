'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  FiDownload, 
  FiEdit2, 
  FiArrowLeft, 
  FiFileText,  
  FiFilm,
  FiImage,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiCalendar,
  FiFolder,
  FiBriefcase,
  FiEye,
  FiEyeOff,
  FiInfo
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

export default function ViewDocumentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard');
        toast.error('Bạn không có quyền truy cập trang này');
      } else {
        fetchDocument();
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router, id]);

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
    } catch (error) {
      console.error('Error loading document:', error);
      toast.error('Đã xảy ra lỗi khi tải tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDocument = async (approve: boolean) => {
    if (!document) return;
    
    setApproving(true);
    try {
      const response = await fetch('/api/documents/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: document.id,
          isApproved: approve
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update document approval status');
      }
      
      // Update document data after approval/rejection
      fetchDocument();
      toast.success(approve ? 'Tài liệu đã được phê duyệt' : 'Tài liệu đã bị từ chối');
    } catch (error) {
      console.error('Error updating document approval:', error);
      toast.error('Đã xảy ra lỗi khi cập nhật trạng thái phê duyệt');
    } finally {
      setApproving(false);
    }
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryName = (categoryValue: string) => {
    const categories = [
      { value: 'REPORT', label: 'Báo cáo' },
      { value: 'CONTRACT', label: 'Hợp đồng' },
      { value: 'GUIDE', label: 'Hướng dẫn' },
      { value: 'FORM', label: 'Biểu mẫu' },
      { value: 'OTHER', label: 'Khác' }
    ];
    
    const category = categories.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };
  
  const getFileType = (filePath: string) => {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    
    if (['pdf'].includes(extension)) {
      return 'pdf';
    } else if (['doc', 'docx'].includes(extension)) {
      return 'word';
    } else if (['xls', 'xlsx'].includes(extension)) {
      return 'excel';
    } else if (['ppt', 'pptx'].includes(extension)) {
      return 'powerpoint';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
      return 'image';
    } else if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(extension)) {
      return 'video';
    } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
      return 'audio';
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return 'archive';
    } else {
      return 'other';
    }
  };
  
  const getFileIcon = (filePath: string) => {
    const type = getFileType(filePath);
    
    switch (type) {
      case 'pdf':
      case 'word':
      case 'excel':
      case 'powerpoint':
      case 'other':
        return <FiFileText className="h-12 w-12 text-orange-600" />;
      case 'image':
        return <FiImage className="h-12 w-12 text-blue-600" />;
      case 'video':
        return <FiFilm className="h-12 w-12 text-red-600" />;
      case 'audio':
        return <FiFileText className="h-12 w-12 text-purple-600" />;
      case 'archive':
        return <FiFolder className="h-12 w-12 text-yellow-600" />;
      default:
        return <FiFileText className="h-12 w-12 text-gray-600" />;
    }
  };
  
  const getFileName = (filePath: string) => {
    return filePath.split('/').pop() || 'file';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Back button skeleton */}
        <div>
          <div className="inline-flex h-10 w-40 rounded-md bg-gray-200 animate-pulse"></div>
        </div>

        {/* Document detail skeleton */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            {/* Title and buttons skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div className="h-8 w-3/4 bg-gray-200 rounded-md mb-4 md:mb-0 animate-pulse"></div>
              <div className="flex flex-wrap gap-2">
                <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-10 w-28 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            </div>
            
            {/* File preview skeleton */}
            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg mb-6">
              <div className="h-16 w-16 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="ml-4">
                <div className="h-6 w-48 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-4 w-64 bg-gray-200 rounded-md mt-2 animate-pulse"></div>
              </div>
            </div>

            {/* Description skeleton */}
            <div className="mb-6">
              <div className="h-6 w-1/4 bg-gray-200 rounded-md mb-2 animate-pulse"></div>
              <div className="h-24 w-full bg-gray-200 rounded-md animate-pulse"></div>
            </div>

            {/* Document info skeleton */}
            <div className="border-t border-gray-200 pt-6">
              <div className="h-6 w-1/4 bg-gray-200 rounded-md mb-4 animate-pulse"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-gray-200 mt-0.5 mr-2 animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                      <div className="h-5 w-40 bg-gray-200 rounded-md mt-1 animate-pulse"></div>
                    </div>
                  </div>
                ))}
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
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 cursor-pointer"
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
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 cursor-pointer"
        >
          <FiArrowLeft className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Quay lại danh sách tài liệu
        </Link>
      </div>

      {/* Document detail */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex-1 mb-4 md:mb-0">{document.title}</h1>
            
            <div className="flex flex-wrap gap-2">
              <a
                href={document.filePath}
                download
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer"
              >
                <FiDownload className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Tải xuống
              </a>
              
              <Link
                href={`/admin/content-review/documents/edit/${document.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
              >
                <FiEdit2 className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Chỉnh sửa
              </Link>
              
              {document.isPublic ? (
                <button
                  onClick={() => handleApproveDocument(false)}
                  disabled={approving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <FiXCircle className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Hủy duyệt
                </button>
              ) : (
                <button
                  onClick={() => handleApproveDocument(true)}
                  disabled={approving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <FiCheckCircle className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Phê duyệt
                </button>
              )}
            </div>
          </div>

          {/* Document status banner */}
          {!document.isPublic && (
            <div className="rounded-md bg-yellow-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiInfo className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Tài liệu đang chờ phê duyệt
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Tài liệu này chưa được phê duyệt và chỉ hiển thị với quản trị viên và người tải lên. Nhân viên khác không thể xem tài liệu này cho đến khi nó được phê duyệt.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File preview */}
          <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg mb-6">
            {getFileIcon(document.filePath)}
            <div className="ml-4">
              <h2 className="text-lg font-medium">{getFileName(document.filePath)}</h2>
              <p className="text-sm text-gray-500">Nhấn vào nút Tải xuống để tải tài liệu này</p>
            </div>
          </div>

          {/* Description */}
          {document.description && (
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Mô tả</h2>
              <div className="bg-gray-50 p-4 rounded-md text-gray-800">
                {document.description}
              </div>
            </div>
          )}

          {/* Document information */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Thông tin tài liệu</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <FiFolder className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phân loại</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getCategoryName(document.category)}</dd>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiCalendar className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ngày tạo</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(document.createdAt)}</dd>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiUser className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Người tải lên</dt>
                  <dd className="mt-1 text-sm text-gray-900">{document.uploadedBy.name}</dd>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiBriefcase className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phòng ban</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {document.department?.name || 'Không có phòng ban'}
                  </dd>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiCalendar className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ngày cập nhật</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(document.updatedAt)}</dd>
                </div>
              </div>
              
              <div className="flex items-start">
                {document.isPublic ? (
                  <FiEye className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                ) : (
                  <FiEyeOff className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Trạng thái</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {document.isPublic ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Đã duyệt - Hiển thị công khai
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Chờ duyệt - Chỉ người tải lên và quản trị viên có thể xem
                      </span>
                    )}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 