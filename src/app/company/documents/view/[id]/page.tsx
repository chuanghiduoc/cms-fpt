'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { FiFileText, FiDownload, FiArrowLeft, FiCalendar, FiUser, FiFolder } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;
  
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
      fetchDocument();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, documentId]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      
      if (response.status === 404) {
        toast.error('Không tìm thấy tài liệu');
        router.push('/employee/documents');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }
      
      const documentData = await response.json();
      setDocument(documentData);
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Đã xảy ra lỗi khi tải thông tin tài liệu');
    } finally {
      setIsLoading(false);
    }
  };

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
    const category = documentCategories.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  const getFileType = (filePath: string) => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    if (!extension) return 'unknown';
    
    if (['pdf'].includes(extension)) {
      return 'pdf';
    } else if (['doc', 'docx'].includes(extension)) {
      return 'word';
    } else if (['xls', 'xlsx'].includes(extension)) {
      return 'excel';
    } else if (['ppt', 'pptx'].includes(extension)) {
      return 'powerpoint';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) {
      return 'image';
    } else {
      return 'other';
    }
  };

  const getFileIcon = () => {
    if (!document) return <FiFileText className="h-16 w-16 text-gray-400" />;
    
    const fileType = getFileType(document.filePath);
    
    switch (fileType) {
      case 'pdf':
        return <FiFileText className="h-16 w-16 text-red-500" />;
      case 'word':
        return <FiFileText className="h-16 w-16 text-blue-500" />;
      case 'excel':
        return <FiFileText className="h-16 w-16 text-green-500" />;
      case 'powerpoint':
        return <FiFileText className="h-16 w-16 text-orange-500" />;
      case 'image':
        return <FiFileText className="h-16 w-16 text-purple-500" />;
      default:
        return <FiFileText className="h-16 w-16 text-gray-500" />;
    }
  };

  const getFileTypeName = () => {
    if (!document) return 'Tệp tin';
    
    const fileType = getFileType(document.filePath);
    
    switch (fileType) {
      case 'pdf':
        return 'Tài liệu PDF';
      case 'word':
        return 'Tài liệu Word';
      case 'excel':
        return 'Bảng tính Excel';
      case 'powerpoint':
        return 'Bài trình bày PowerPoint';
      case 'image':
        return 'Hình ảnh';
      default:
        return 'Tệp tin';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-orange-600" role="status">
          <span className="visually-hidden"></span>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-gray-600">Không tìm thấy tài liệu</p>
        <Link href="/employee/documents" className="mt-4 inline-block text-orange-600 hover:text-orange-800 font-medium">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link 
          href="/employee/documents" 
          className="flex items-center text-orange-600 hover:text-orange-800 font-medium"
        >
          <FiArrowLeft className="mr-2" />
          Quay lại danh sách
        </Link>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* File preview/icon */}
            <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-gray-50 rounded-lg">
              {getFileIcon()}
              <p className="text-sm text-gray-500">{getFileTypeName()}</p>
              <a
                href={document.filePath}
                download
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <FiDownload className="mr-2 h-4 w-4" />
                Tải xuống
              </a>
            </div>
            
            {/* Document details */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{document.title}</h1>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <FiFolder className="mr-2 h-4 w-4" />
                    <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-800 font-medium">
                      {getCategoryName(document.category)}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <FiUser className="mr-2 h-4 w-4" />
                    {document.uploadedBy.name}
                  </div>
                  
                  <div className="flex items-center">
                    <FiCalendar className="mr-2 h-4 w-4" />
                    {formatDate(document.createdAt)}
                  </div>
                </div>
              </div>
              
              {document.description && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Mô tả</h2>
                  <p className="text-gray-700 whitespace-pre-line">{document.description}</p>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Thông tin thêm</h2>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="w-32 text-sm text-gray-500">Phòng ban:</span>
                    <span className="text-sm font-medium">{document.department?.name || 'Không có phòng ban'}</span>
                  </div>
                  
                  <div className="flex items-start">
                    <span className="w-32 text-sm text-gray-500">Ngày cập nhật:</span>
                    <span className="text-sm font-medium">{formatDate(document.updatedAt)}</span>
                  </div>
                </div>
              </div>
              
              {/* Preview based on file type */}
              {getFileType(document.filePath) === 'image' && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Xem trước</h2>
                  <div className="mt-2 overflow-hidden rounded-lg">
                    <img
                      src={document.filePath}
                      alt={document.title}
                      className="max-w-full h-auto"
                    />
                  </div>
                </div>
              )}
              
              {getFileType(document.filePath) === 'pdf' && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Xem trước</h2>
                  <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden aspect-video">
                    <iframe
                      src={document.filePath}
                      className="w-full h-full"
                      title={document.title}
                    ></iframe>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 