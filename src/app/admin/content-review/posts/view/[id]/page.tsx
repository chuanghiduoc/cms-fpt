'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FiInfo,
  FiImage,
  FiUser,
  FiCalendar,
  FiBriefcase,
  FiTag,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiArrowLeft,
  FiEdit2,
  FiTrash2
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  departmentId: string | null;
  isPublic: boolean;
  status: string;
  reviewedById: string | null;
  reviewedAt: string | null;
  tags: string[];
  coverImageUrl: string | null;
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
  } | null;
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function ViewPostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard');
        toast.error('Bạn không có quyền truy cập trang này');
      } else {
        fetchPost();
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router, id]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${id}`);
      
      if (response.status === 404) {
        toast.error('Không tìm thấy bài viết');
        router.push('/admin/content-review/posts');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch post');
      }
      
      const postData = await response.json();
      setPost(postData);
    } catch (error) {
      console.error('Error loading post:', error);
      toast.error('Đã xảy ra lỗi khi tải bài viết');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePost = async (approve: boolean) => {
    if (!post) return;
    
    setApproving(true);
    try {
      const response = await fetch('/api/posts/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          isApproved: approve
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update post approval status');
      }
      
      // Update post data after approval/rejection
      fetchPost();
      toast.success(approve ? 'Bài viết đã được phê duyệt' : 'Bài viết đã bị từ chối');
    } catch (error) {
      console.error('Error updating post approval:', error);
      toast.error('Đã xảy ra lỗi khi cập nhật trạng thái phê duyệt');
    } finally {
      setApproving(false);
    }
  };

  const handleDeletePost = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDeletePost = async () => {
    if (!post) return;
    
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
      
      toast.success('Đã xóa bài viết thành công');
      router.push('/admin/content-review/posts');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Đã xảy ra lỗi khi xóa bài viết');
    } finally {
      setIsDeleteModalOpen(false);
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
  
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Back button skeleton */}
        <div>
          <div className="inline-flex h-10 w-40 rounded-md bg-gray-200 animate-pulse"></div>
        </div>

        {/* Post detail skeleton */}
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
            
            {/* Cover image skeleton */}
            <div className="mb-6">
              <div className="h-6 w-1/4 bg-gray-200 rounded-md mb-2 animate-pulse"></div>
              <div className="h-64 md:h-96 w-full bg-gray-200 rounded-lg animate-pulse"></div>
            </div>

            {/* Content skeleton */}
            <div className="mb-6">
              <div className="h-6 w-1/4 bg-gray-200 rounded-md mb-2 animate-pulse"></div>
              <div className="space-y-3 bg-gray-50 p-6 rounded-md">
                <div className="h-5 w-full bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-5 w-11/12 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-5 w-full bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-5 w-10/12 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-5 w-full bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-5 w-9/12 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            </div>

            {/* Post info skeleton */}
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

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Không tìm thấy bài viết</h2>
        <p className="mt-2 text-gray-600">Bài viết không tồn tại hoặc đã bị xóa.</p>
        <div className="mt-6">
          <Link
            href="/admin/content-review/posts"
            className="inline-flex items-center text-md font-medium text-orange-600 hover:text-orange-700 focus:outline-none cursor-pointer"
          >
            <FiArrowLeft className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Quay lại danh sách bài viết
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
          href="/admin/content-review/posts"
          className="inline-flex items-center text-md font-medium text-orange-600 hover:text-orange-700 focus:outline-none cursor-pointer"
          >
          <FiArrowLeft className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Quay lại danh sách bài viết
        </Link>
      </div>

      {/* Post detail */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex-1 mb-4 md:mb-0">{post.title}</h1>
            
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/admin/content-review/posts/edit/${post.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 cursor-pointer"
              >
                <FiEdit2 className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                Chỉnh sửa
              </Link>
              
              {post.isPublic ? (
                <button
                  onClick={() => handleApprovePost(false)}
                  disabled={approving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <FiXCircle className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                  Hủy duyệt
                </button>
              ) : (
                <button
                  onClick={() => handleApprovePost(true)}
                  disabled={approving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <FiCheckCircle className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                  Phê duyệt
                </button>
              )}
              
              <button
                onClick={handleDeletePost}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
              >
                <FiTrash2 className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                Xóa
              </button>
            </div>
          </div>
          
          {/* Post status banner */}
          {!post.isPublic && (
            <div className="rounded-md bg-yellow-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiInfo className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Bài viết đang chờ phê duyệt
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Bài viết này chưa được phê duyệt và chỉ hiển thị với quản trị viên và người tạo. Nhân viên khác không thể xem bài viết này cho đến khi nó được phê duyệt.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cover image preview */}
          {post.coverImageUrl ? (
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Ảnh bìa</h2>
              <div className="relative h-64 md:h-96 w-full overflow-hidden rounded-lg border border-gray-200">
                <Image
                  src={post.coverImageUrl}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg mb-6">
              <FiImage className="h-12 w-12 text-gray-400" />
              <div className="ml-4">
                <h2 className="text-lg font-medium">Không có ảnh bìa</h2>
                <p className="text-sm text-gray-500">Bài viết này không có ảnh bìa</p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Nội dung bài viết</h2>
            <div className="prose prose-orange prose-lg max-w-none bg-gray-50 p-6 rounded-md">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
          </div>

          {/* Post information */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Thông tin bài viết</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <FiUser className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tác giả</dt>
                  <dd className="mt-1 text-sm text-gray-900">{post.author.name}</dd>
                  <dd className="mt-0.5 text-xs text-gray-500">{post.author.email}</dd>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiCalendar className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ngày tạo</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(post.createdAt)}</dd>
                </div>
              </div>
              
              <div className="flex items-start">
                <FiBriefcase className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phòng ban</dt>
                  <dd className="mt-1 text-sm text-gray-900">{post.department?.name || 'Không có phòng ban'}</dd>
                </div>
              </div>
              
              {post.reviewedAt && (
                <div className="flex items-start">
                  <FiClock className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Ngày duyệt</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(post.reviewedAt)}</dd>
                  </div>
                </div>
              )}
              
              {post.reviewedById && post.reviewedBy && (
                <div className="flex items-start">
                  <FiUser className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Người duyệt</dt>
                    <dd className="mt-1 text-sm text-gray-900">{post.reviewedBy.name}</dd>
                    <dd className="mt-0.5 text-xs text-gray-500">{post.reviewedBy.email}</dd>
                  </div>
                </div>
              )}
              
              {post.tags && post.tags.length > 0 && (
                <div className="flex items-start">
                  <FiTag className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Thẻ</dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {post.tags.map((tag, index) => (
                        <span key={index} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                </div>
              )}
              
              <div className="flex items-start">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center ${post.isPublic ? 'bg-green-100' : 'bg-yellow-100'} mt-0.5 mr-2`}>
                  {post.isPublic ? 
                    <FiCheckCircle className="h-4 w-4 text-green-600" /> : 
                    <FiXCircle className="h-4 w-4 text-yellow-600" />
                  }
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Trạng thái</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {post.isPublic ? 'Đã duyệt' : 'Chờ duyệt'}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeletePost}
        title="Xóa bài viết"
        message={`Bạn có chắc chắn muốn xóa bài viết "${post.title}" không? Hành động này không thể hoàn tác.`}
      />
    </div>
  );
} 