'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiEdit, FiSearch, FiChevronRight, FiChevronLeft, FiUser, FiCalendar, FiX, FiClock, FiBookmark } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
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

export default function CompanyPostsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State for posts
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Filters state (giữ lại để không phải sửa logic fetch)
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [totalItems, setTotalItems] = useState(0);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        type: 'tween', 
        duration: 0.5, 
        ease: 'easeInOut' 
      } 
    }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeInOut' } }
  };

  // Fetch posts and available departments
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchDepartments();
    }
  }, [status, session, router]);

  // Combined fetch posts effect with debounce for all filter changes
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      fetchPosts();
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTerm, currentPage, selectedDepartment, selectedTag, status]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) {
        console.error('Failed to fetch departments:', response.status);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      // Add pagination
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', itemsPerPage.toString());
      
      // Add search term if exists
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      // Add department filter if not 'all'
      if (selectedDepartment !== 'all') {
        queryParams.append('departmentId', selectedDepartment);
      }

      // Add tag filter if selected
      if (selectedTag) {
        queryParams.append('tag', selectedTag);
      }
      
      // Only show approved posts
      queryParams.append('status', 'APPROVED');
      
      // Add department access filter to show only posts from user's department or public posts
      const departmentId = session?.user?.department || '';
      queryParams.append('departmentAccess', departmentId);
      
      // Also include admin posts
      queryParams.append('includeAdminPosts', 'true');
      
      // Fetch posts from API
      const response = await fetch(`/api/posts?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const data = await response.json();
      setPosts(data.posts || []);
      setTotalItems(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Đã xảy ra lỗi khi tải danh sách bài viết');
      setPosts([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format dates
  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM/yyyy');
  }, []);

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number) => {
    // Remove HTML tags
    const plainText = text.replace(/<[^>]*>?/gm, '');
    
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedDepartment('all');
    setSelectedTag('');
    setSearchTerm('');
  };

  // Calculate read time (approx 200 words per minute)
  const calculateReadTime = (content: string) => {
    if (!content) return '1 phút';
    
    const plainText = content.replace(/<[^>]*>?/gm, '');
    const words = plainText.trim().split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(words / 200));
    return `${readTime} phút`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 relative pb-16 sm:pb-6"
    >

      {/* Search section */}
      <motion.div 
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="bg-white shadow-md rounded-lg overflow-hidden"
      >
        {/* Search bar */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <motion.input
              whileFocus={{ boxShadow: "0 0 0 2px rgba(249, 115, 22, 0.2)" }}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-colors text-sm"
              placeholder="Tìm kiếm bài viết..."
            />
            {searchTerm && (
              <AnimatePresence>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <motion.button 
                    whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
                    onClick={() => setSearchTerm('')}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <FiX className="h-4 w-4" />
                  </motion.button>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Posts summary */}
      <motion.div 
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="px-1 py-2"
      >
        {!loading && (
          <div className="text-sm text-gray-500">
            Hiển thị <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> đến{' '}
            <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> của{' '}
            <span className="font-medium">{totalItems}</span> bài viết
            {searchTerm && <span> với từ khóa &ldquo;{searchTerm}&rdquo;</span>}
          </div>
        )}
      </motion.div>
      
      {/* Posts grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white shadow-md rounded-lg overflow-hidden animate-pulse">
              <div className="h-52 bg-gray-200"></div>
              <div className="p-5 space-y-4">
                <div className="h-6 bg-gray-200 rounded-md w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded-md w-full"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-4/6"></div>
                </div>
                <div className="pt-2 flex gap-2">
                  <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                  <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-5 bg-gray-200 rounded-md w-24"></div>
                  <div className="h-5 bg-gray-200 rounded-md w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white shadow-md rounded-lg p-10 text-center"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-orange-500 mb-4"
          >
            <FiEdit className="h-8 w-8" />
          </motion.div>
          <h3 className="text-lg font-medium text-gray-900">Không có bài viết</h3>
          <p className="mt-2 text-base text-gray-500 max-w-md mx-auto">
            {(selectedDepartment !== 'all' || selectedTag || searchTerm) ?
              'Không tìm thấy bài viết nào phù hợp với bộ lọc hiện tại.' :
              'Hiện tại không có bài viết nào.'
            }
          </p>
          {(selectedDepartment !== 'all' || selectedTag || searchTerm) && (
            <motion.button
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
              onClick={resetFilters}
              className="mt-6 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors"
            >
              Xóa tất cả bộ lọc
            </motion.button>
          )}
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {posts && posts.length > 0 && posts.map((post) => (
            <motion.div
              key={post.id}
              className="group bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -3, transition: { duration: 0.3, ease: 'easeOut' } }}
            >
              <Link href={`/company/posts/${post.id}`} className="block h-full">
                <div className="relative h-52 w-full bg-gray-100">
                  {post.coverImageUrl ? (
                    <Image
                      src={post.coverImageUrl}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <FiEdit className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  {post.department && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                      {post.department.name}
                    </div>
                  )}
                  <motion.div 
                    className="absolute top-3 right-3 flex space-x-2"
                    whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                  >
                    <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm text-orange-500 cursor-pointer">
                      <FiBookmark className="h-4 w-4" />
                    </div>
                  </motion.div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors duration-200">
                    {post.title}
                  </h3>
                  <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                    {truncateText(post.content, 150)}
                  </p>
                  
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="inline-block bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="inline-block bg-gray-50 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                          +{post.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex items-center text-xs text-gray-500">
                      <FiUser className="mr-1.5 h-3 w-3" />
                      {post.author && post.author.name}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <FiCalendar className="mr-1.5 h-3 w-3" />
                      {formatDate(post.createdAt)}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center text-xs text-gray-500">
                      <FiClock className="mr-1.5 h-3 w-3" />
                      {calculateReadTime(post.content)}
                    </div>
                    <span className="inline-flex items-center text-sm font-medium text-orange-600 group-hover:text-orange-800 transition-colors duration-200">
                      Xem chi tiết
                      <FiChevronRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
      
      {/* Pagination */}
      {!loading && posts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mt-6"
        >
          <nav className="flex items-center" aria-label="Pagination">
            <motion.button
              whileHover={{ scale: currentPage !== 1 ? 1.05 : 1, transition: { duration: 0.2 } }}
              whileTap={{ scale: currentPage !== 1 ? 0.95 : 1, transition: { duration: 0.1 } }}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-3 py-2 rounded-l-md border text-sm font-medium ${
                currentPage === 1
                  ? 'text-gray-300 bg-white border-gray-300 cursor-not-allowed'
                  : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <span className="sr-only">Trang trước</span>
              <FiChevronLeft className="h-5 w-5" />
            </motion.button>
            
            {Array.from({ length: Math.ceil(totalItems / itemsPerPage) }).map((_, index) => {
              const page = index + 1;
              
              // Show limited page numbers to avoid clutter
              if (
                page === 1 ||
                page === Math.ceil(totalItems / itemsPerPage) ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <motion.button
                    key={page}
                    whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === page
                        ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </motion.button>
                );
              }
              
              // Show ellipsis for gaps
              if (
                (page === 2 && currentPage > 3) ||
                (page === Math.ceil(totalItems / itemsPerPage) - 1 && currentPage < Math.ceil(totalItems / itemsPerPage) - 2)
              ) {
                return (
                  <span
                    key={page}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    ...
                  </span>
                );
              }
              
              return null;
            })}
            
            <motion.button
              whileHover={{ scale: currentPage !== Math.ceil(totalItems / itemsPerPage) ? 1.05 : 1, transition: { duration: 0.2 } }}
              whileTap={{ scale: currentPage !== Math.ceil(totalItems / itemsPerPage) ? 0.95 : 1, transition: { duration: 0.1 } }}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === Math.ceil(totalItems / itemsPerPage)}
              className={`relative inline-flex items-center px-3 py-2 rounded-r-md border text-sm font-medium ${
                currentPage === Math.ceil(totalItems / itemsPerPage)
                  ? 'text-gray-300 bg-white border-gray-300 cursor-not-allowed'
                  : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <span className="sr-only">Trang sau</span>
              <FiChevronRight className="h-5 w-5" />
            </motion.button>
          </nav>
        </motion.div>
      )}
    </motion.div>
  );
}
