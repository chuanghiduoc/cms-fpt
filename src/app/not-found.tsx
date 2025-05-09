'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiHome } from 'react-icons/fi';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-8">
      <div className="w-full max-w-md sm:max-w-xl">
        <motion.div
          className="relative z-10 overflow-hidden rounded-2xl bg-white p-8 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute -right-8 -top-8 h-64 w-64 rounded-full bg-orange-50/80" />
          <div className="absolute -bottom-8 -left-8 h-64 w-64 rounded-full bg-blue-50/80" />

          <div className="relative z-10">
            <div className="flex flex-col items-center justify-center pb-6 pt-8 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-2 text-9xl font-bold text-orange-500"
              >
                404
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mb-3 text-3xl font-bold text-gray-900"
              >
                Không tìm thấy trang
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mb-8 text-gray-600"
              >
                Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
              </motion.p>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                  className="w-full sm:w-1/2"
                >
                  <Link
                    href="/"
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-orange-600 px-5 py-2.5 text-sm font-medium text-white shadow-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition duration-150 duration-200"
                  >
                    <FiHome className="h-4 w-4" />
                    Về trang chủ
                  </Link>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9, duration: 0.4 }}
                  className="w-full sm:w-1/2"
                >
                  <button
                    onClick={() => window.history.back()}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition duration-150 duration-200"
                  >
                    <FiArrowLeft className="h-4 w-4" />
                    Quay lại
                  </button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-6 text-center text-sm text-gray-500"
        >
          <p>
            Nếu bạn nghĩ đây là lỗi, vui lòng{' '}
            <Link href="/support" className="font-medium text-orange-600 hover:text-orange-500">
              liên hệ hỗ trợ
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
} 