'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FiUser, FiMail, FiBriefcase, FiEdit2, FiExternalLink } from 'react-icons/fi';
import { MdOutlineCorporateFare } from 'react-icons/md';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [department, setDepartment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }

    // Fetch department information if user has a department
    const fetchDepartment = async () => {
      if (session?.user?.department) {
        try {
          const response = await fetch(`/api/departments/${session.user.department}`);
          if (response.ok) {
            const data = await response.json();
            setDepartment(data.name);
          }
        } catch (error) {
          console.error('Error fetching department:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchDepartment();
    }
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 p-8 sm:flex sm:items-center">
            <div className="relative mb-6 sm:mb-0 sm:mr-8 flex-shrink-0">
              <div className="h-32 w-32 rounded-full bg-gray-200 animate-pulse"></div>
            </div>
            <div className="w-full">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            </div>
            <div className="divide-y divide-gray-200">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="px-6 py-5 flex items-center">
                  <div className="flex-shrink-0 mr-4">
                    <div className="h-10 w-10 rounded-md bg-gray-200 animate-pulse"></div>
                  </div>
                  <div className="w-full">
                    <div className="h-4 bg-gray-200 rounded w-1/5 mb-2 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleLabel = (role: string | undefined) => {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị viên';
      case 'DEPARTMENT_HEAD':
        return 'Trưởng phòng';
      case 'EMPLOYEE':
        return 'Nhân viên';
      default:
        return 'Không xác định';
    }
  };

  const getRoleColor = (role: string | undefined) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
      case 'DEPARTMENT_HEAD':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'EMPLOYEE':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <DashboardLayout>
      <motion.div 
        className="max-w-5xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="bg-white rounded-xl shadow-md overflow-hidden mb-6"
          variants={itemVariants}
        >
          <div className="p-8 sm:flex sm:items-center">
            <div className="relative mb-6 sm:mb-0 sm:mr-8 flex-shrink-0">
              <div className="h-32 w-32 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl font-medium shadow-lg transform hover:scale-105 transition-transform duration-300">
                {getUserInitials(session?.user?.name)}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {session?.user?.name}
              </h1>
              <div className="flex items-center space-x-3 mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(session?.user?.role)}`}>
                  {getRoleLabel(session?.user?.role)}
                </span>
                {department && (
                  <span className="text-gray-500 text-sm flex items-center">
                    <MdOutlineCorporateFare className="mr-1" />
                    {department}
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm">{session?.user?.email}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-xl shadow-md overflow-hidden"
          variants={itemVariants}
        >
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Thông tin chi tiết</h2>
          </div>
          <div className="divide-y divide-gray-200">
            <motion.div 
              className="px-6 py-5 flex items-center group"
              variants={itemVariants}
            >
              <div className="flex-shrink-0 mr-4">
                <div className="h-10 w-10 rounded-md bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors duration-200">
                  <FiUser className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors duration-200">Họ và tên</p>
                <p className="mt-1 text-base font-medium text-gray-900">{session?.user?.name || 'Chưa cập nhật'}</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="px-6 py-5 flex items-center group"
              variants={itemVariants}
            >
              <div className="flex-shrink-0 mr-4">
                <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                  <FiMail className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors duration-200">Email</p>
                <p className="mt-1 text-base font-medium text-gray-900">{session?.user?.email || 'Chưa cập nhật'}</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="px-6 py-5 flex items-center group"
              variants={itemVariants}
            >
              <div className="flex-shrink-0 mr-4">
                <div className="h-10 w-10 rounded-md bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors duration-200">
                  <FiBriefcase className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors duration-200">Chức vụ</p>
                <p className="mt-1 text-base font-medium text-gray-900">{getRoleLabel(session?.user?.role)}</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="px-6 py-5 flex items-center group"
              variants={itemVariants}
            >
              <div className="flex-shrink-0 mr-4">
                <div className="h-10 w-10 rounded-md bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors duration-200">
                  <MdOutlineCorporateFare className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors duration-200">Phòng ban</p>
                <p className="mt-1 text-base font-medium text-gray-900">{department || 'Không có phòng ban'}</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
        
        <motion.div 
          className="mt-6 flex justify-between items-center"
          variants={itemVariants}
        >
          <motion.a
            href="https://www.fpt-software.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            style={{ cursor: 'pointer' }}
          >
            <FiExternalLink className="mr-1 h-4 w-4" />
            FPT Software
          </motion.a>
          
          <motion.button
            type="button"
            onClick={() => router.push('/profile/settings')}
            className="inline-flex justify-center py-2.5 px-5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            style={{ cursor: 'pointer', outline: 'none' }}
          >
            <FiEdit2 className="mr-2 h-4 w-4" />
            Cài đặt tài khoản
          </motion.button>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
} 