'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiFileText, FiEdit, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function ContentReviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Framer motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  // Check if user is authorized
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div 
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"
        ></motion.div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (session?.user?.role !== 'ADMIN') {
    toast.error('Bạn không có quyền truy cập trang này');
    router.push('/dashboard');
    return null;
  }

  return (
    <motion.div 
      className="container mx-auto px-4 py-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Documents Card */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
          variants={cardVariants}
          whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
        >
          <div className="p-8">
            <div className="flex items-center mb-5">
              <motion.div 
                className="bg-blue-100 p-4 rounded-full"
                whileHover={{ scale: 1.1, backgroundColor: "#dbeafe" }}
                whileTap={{ scale: 0.95 }}
              >
                <FiFileText className="text-blue-600 text-2xl" />
              </motion.div>
              <h2 className="text-2xl font-bold ml-4 text-gray-800">Tài liệu</h2>
            </div>
            
            <p className="text-gray-600 mb-8 text-lg">
              Quản lý, duyệt và tổ chức các tài liệu trong hệ thống. Bạn có thể xem, chỉnh sửa hoặc xóa tài liệu.
            </p>
            
            <motion.div whileTap={{ scale: 0.98 }}>
              <Link href="/admin/content-review/documents" 
                className="flex items-center justify-between bg-blue-600 text-white font-medium py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300 w-full">
                <span className="text-lg">Quản lý tài liệu</span>
                <motion.div
                  initial={{ x: 0 }}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <FiArrowRight className="ml-2" size={20} />
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Posts Card */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
          variants={cardVariants}
          whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
        >
          <div className="p-8">
            <div className="flex items-center mb-5">
              <motion.div 
                className="bg-green-100 p-4 rounded-full"
                whileHover={{ scale: 1.1, backgroundColor: "#dcfce7" }}
                whileTap={{ scale: 0.95 }}
              >
                <FiEdit className="text-green-600 text-2xl" />
              </motion.div>
              <h2 className="text-2xl font-bold ml-4 text-gray-800">Bài viết</h2>
            </div>
            
            <p className="text-gray-600 mb-8 text-lg">
              Quản lý, duyệt và tổ chức các bài viết trong hệ thống. Bạn có thể xem, chỉnh sửa hoặc xóa bài viết.
            </p>
            
            <motion.div whileTap={{ scale: 0.98 }}>
              <Link href="/admin/content-review/posts" 
                className="flex items-center justify-between bg-green-600 text-white font-medium py-4 px-6 rounded-lg hover:bg-green-700 transition-colors duration-300 w-full">
                <span className="text-lg">Quản lý bài viết</span>
                <motion.div
                  initial={{ x: 0 }}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <FiArrowRight className="ml-2" size={20} />
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
