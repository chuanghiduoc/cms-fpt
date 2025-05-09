'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiEdit2, FiTrash2, FiArrowLeft, FiCalendar, FiUser, FiTag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

interface Post {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  tags: string[];
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  department: {
    id: string;
    name: string;
  };
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Custom CSS for HTML content elements
  const contentStyle = `
    .prose a {
      cursor: pointer;
      text-decoration: underline;
      color: #2563eb;
    }
    
    .prose a:hover {
      color: #1d4ed8;
    }
    
    .prose button,
    .prose input[type="button"],
    .prose input[type="submit"],
    .prose input[type="reset"] {
      cursor: pointer;
    }
    
    .prose input[type="checkbox"],
    .prose input[type="radio"] {
      cursor: pointer;
    }
    
    .prose select,
    .prose option {
      cursor: pointer;
    }
    
    .prose label {
      cursor: pointer;
    }
    
    .prose img {
      max-width: 100%;
      height: auto;
    }
    
    .prose table {
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0;
    }
    
    .prose table th,
    .prose table td {
      border: 1px solid #e5e7eb;
      padding: 0.5rem;
    }
    
    .prose table th {
      background-color: #f9fafb;
    }
    
    .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
      margin-top: 2rem;
      margin-bottom: 1rem;
      font-weight: 600;
      line-height: 1.25;
    }
  `;
  
  useEffect(() => {
    if (status === 'authenticated' && postId) {
      fetchPost();
    }
  }, [status, postId]);
  
  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Bài viết không tồn tại');
          router.push('/admin/posts');
          return;
        }
        throw new Error('Failed to fetch post');
      }
      
      const data = await response.json();
      setPost(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post data');
      router.push('/admin/posts');
    }
  };
  
  const handleDeletePost = async () => {
    if (!post) return;
    
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
      
      toast.success('Đã xóa bài viết thành công');
      router.push('/admin/posts');
    } catch (error) {
      console.error('Lỗi khi xóa bài viết:', error);
      toast.error('Đã xảy ra lỗi khi xóa bài viết');
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
  
  if (status === 'loading' || loading) {
    return <div className="p-6 text-center">Đang tải...</div>;
  }
  
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }
  
  if (session?.user?.role !== 'ADMIN' ) {
    router.push('/dashboard');
    toast.error('Bạn không có quyền truy cập trang này');
    return null;
  }
  
  if (!post) {
    return <div className="p-6 text-center">Không tìm thấy bài viết</div>;
  }
  
  return (
    <div className="space-y-6 pb-8">
      {/* Inject custom CSS */}
      <style dangerouslySetInnerHTML={{ __html: contentStyle }} />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/admin/posts" className="mr-4 text-gray-500 hover:text-gray-700 cursor-pointer">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            Chi tiết bài viết
          </h1>
        </div>
        
        <div className="flex space-x-3">
          <Link href={`/admin/posts/edit/${post.id}`}>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
              <FiEdit2 className="mr-2 -ml-0.5 h-4 w-4" /> Chỉnh sửa
            </button>
          </Link>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
          >
            <FiTrash2 className="mr-2 -ml-0.5 h-4 w-4" /> Xóa
          </button>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeletePost}
        title="Xóa bài viết"
        message="Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác."
      />
      
      {/* Post Metadata */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {post.coverImageUrl && (
          <div className="relative h-64 w-full">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}
        
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {post.title}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${post.isPublic ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {post.isPublic ? 'Công khai' : 'Nội bộ'}
              </span>
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiCalendar className="mr-2" /> Thời gian
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div>Tạo lúc: {formatDate(post.createdAt)}</div>
                {post.createdAt !== post.updatedAt && (
                  <div className="text-gray-500">
                    Cập nhật lần cuối: {formatDate(post.updatedAt)}
                  </div>
                )}
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiUser className="mr-2" /> Tác giả
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {post.author.name} ({post.author.email})
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Phòng ban</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {post.department.name}
              </dd>
            </div>
            
            {post.tags.length > 0 && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FiTag className="mr-2" /> Tags
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-default"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      
      {/* Post Content */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Nội dung bài viết
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <article 
            className="prose prose-lg max-w-none prose-img:rounded-md prose-headings:text-gray-900 prose-a:text-blue-600"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </div>
    </div>
  );
} 