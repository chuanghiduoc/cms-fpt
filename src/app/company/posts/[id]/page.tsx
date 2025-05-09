'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft, FiCalendar, FiUser, FiTag, FiBriefcase, FiShare2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface Post {
  id: string;
  title: string;
  content: string;
  coverImageUrl: string | null;
  isPublic: boolean;
  status: string;
  tags: string[];
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
}

export default function PostDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (params?.id && status === 'authenticated') {
      fetchPost(params.id as string);
    }
  }, [params?.id, status, router]);

  const fetchPost = async (postId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/${postId}`);
      
      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || 'Failed to fetch post');
        router.push('/company/posts');
        return;
      }
      
      const data = await response.json();
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Could not load post');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title || 'Shared post',
        text: `Check out this post: ${post?.title}`,
        url: window.location.href,
      })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing:', error));
    } else {
      // Copy URL to clipboard as fallback
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết vào bộ nhớ tạm!');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Back button skeleton */}
        <div className="h-10 w-40 bg-gray-200 animate-pulse rounded-md"></div>
        
        {/* Post content skeleton */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="h-64 bg-gray-200 animate-pulse"></div>
          <div className="p-6 space-y-6">
            <div className="h-8 bg-gray-200 animate-pulse w-3/4 rounded-md"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 animate-pulse w-full rounded-md"></div>
              <div className="h-4 bg-gray-200 animate-pulse w-full rounded-md"></div>
              <div className="h-4 bg-gray-200 animate-pulse w-3/4 rounded-md"></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="h-6 bg-gray-200 animate-pulse w-20 rounded-full"></div>
              <div className="h-6 bg-gray-200 animate-pulse w-24 rounded-full"></div>
              <div className="h-6 bg-gray-200 animate-pulse w-16 rounded-full"></div>
            </div>
            <div className="border-t border-gray-200 pt-4 flex justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full mr-2"></div>
                <div className="h-5 bg-gray-200 animate-pulse w-32 rounded-md"></div>
              </div>
              <div className="h-5 bg-gray-200 animate-pulse w-32 rounded-md"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900">Không tìm thấy bài viết</h3>
        <p className="mt-2 text-gray-500">Bài viết có thể đã bị xóa hoặc không tồn tại.</p>
        <div className="mt-6">
          <Link 
            href="/company/posts"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <FiArrowLeft className="mr-2 h-4 w-4" />
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
          href="/company/posts"
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <FiArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách bài viết
        </Link>
      </div>
      
      {/* Post content */}
      <motion.div 
        className="bg-white shadow rounded-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {post.coverImageUrl && (
          <div className="relative h-64 md:h-96 w-full">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              priority
              className="object-cover"
            />
          </div>
        )}
        
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
          
          <div className="flex flex-wrap items-center text-sm text-gray-500 mb-6 gap-x-4 gap-y-2">
            <div className="flex items-center">
              <FiUser className="mr-1" />
              <span>{post.author.name}</span>
            </div>
            <div className="flex items-center">
              <FiCalendar className="mr-1" />
              <span>{formatDate(post.createdAt)}</span>
            </div>
            {post.department && (
              <div className="flex items-center">
                <FiBriefcase className="mr-1" />
                <span>{post.department.name}</span>
              </div>
            )}
            <div className="flex-grow"></div>
            <button 
              onClick={handleShare}
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <FiShare2 className="mr-1" />
              Chia sẻ
            </button>
          </div>
          
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  <FiTag className="mr-1 h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Post content */}
          <div className="prose prose-orange max-w-none mt-6 prose-img:rounded-md prose-headings:text-gray-900 prose-a:text-orange-600">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
          
          {/* Post footer */}
          <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-orange-100 text-orange-600">
                  {post.author.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{post.author.name}</p>
                <p className="text-sm text-gray-500">
                  {post.department ? post.department.name : 'Toàn công ty'}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {post.updatedAt !== post.createdAt ? 
                `Cập nhật lần cuối: ${formatDate(post.updatedAt)}` :
                `Đăng ngày: ${formatDate(post.createdAt)}`
              }
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 