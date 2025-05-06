'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiArrowLeft,
  FiSave,
  FiKey,
  FiShield,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function ProfileSettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);
  
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }
  
  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
          
          <div className="mb-6 flex items-center">
            <div className="h-8 w-56 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="border-b border-gray-200">
              <div className="flex">
                <div className="px-6 py-4 w-40 h-12 bg-gray-100 animate-pulse rounded-md"></div>
                <div className="px-6 py-4 w-40 h-12 bg-gray-100 animate-pulse rounded-md ml-2"></div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
                </div>
                
                <div>
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex justify-end">
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
        }),
      });
      
      if (response.ok) {
        setSuccess('Thông tin cá nhân đã được cập nhật thành công.');
        // Update the session to reflect the changes
        await update({
          ...session,
          user: {
            ...session?.user,
            name,
          },
        });
      } else {
        const data = await response.json();
        setError(data.message || 'Có lỗi xảy ra khi cập nhật thông tin.');
      }
    } catch (error) {
      setError('Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại sau.');
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      
      if (response.ok) {
        setSuccess('Mật khẩu đã được thay đổi thành công.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await response.json();
        setError(data.message || 'Có lỗi xảy ra khi thay đổi mật khẩu.');
      }
    } catch (error) {
      setError('Có lỗi xảy ra khi thay đổi mật khẩu. Vui lòng thử lại sau.');
      console.error('Error changing password:', error);
    } finally {
      setIsLoading(false);
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
  
  const tabVariants = {
    active: { 
      borderColor: '#f97316', 
      color: '#f97316',
      backgroundColor: '#fff7ed'
    },
    inactive: { 
      borderColor: 'transparent', 
      color: '#6b7280',
      backgroundColor: 'transparent'
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
        <motion.button
          type="button"
          onClick={() => router.push('/profile')}
          className="flex items-center text-gray-600 hover:text-orange-500 px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-200 mb-3"
          whileHover={{ scale: 1.03, x: -3 }}
          whileTap={{ scale: 0.97 }}
          style={{ cursor: 'pointer', alignSelf: 'flex-start' }}
        >
          <FiArrowLeft className="mr-2 h-4 w-4" />
          Quay lại trang cá nhân
        </motion.button>
        
        <motion.div 
          className="mb-6 flex items-center"
          variants={itemVariants}
        >
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FiUser className="mr-2" />
            Cài đặt tài khoản
          </h1>
        </motion.div>
        
        <motion.div 
          className="bg-white rounded-xl shadow-md overflow-hidden mb-6"
          variants={itemVariants}
        >
          <div className="border-b border-gray-200">
            <div className="flex">
              <motion.button
                className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'profile' ? 'text-orange-600 border-orange-500 bg-orange-50' : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('profile')}
                variants={tabVariants}
                animate={activeTab === 'profile' ? 'active' : 'inactive'}
                whileHover={activeTab !== 'profile' ? { y: -1 } : {}}
                style={{ cursor: 'pointer' }}
              >
                <span className="flex items-center">
                  <FiUser className="mr-2 h-4 w-4" />
                  Thông tin cá nhân
                </span>
              </motion.button>
              
              <motion.button
                className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === 'password' ? 'text-orange-600 border-orange-500 bg-orange-50' : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('password')}
                variants={tabVariants}
                animate={activeTab === 'password' ? 'active' : 'inactive'}
                whileHover={activeTab !== 'password' ? { y: -1 } : {}}
                style={{ cursor: 'pointer' }}
              >
                <span className="flex items-center">
                  <FiKey className="mr-2 h-4 w-4" />
                  Đổi mật khẩu
                </span>
              </motion.button>
            </div>
          </div>
          
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleUpdateProfile}>
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Họ và tên
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUser className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10 block w-full py-3 rounded-md border-gray-300 shadow-sm text-base"
                          placeholder="Nhập họ và tên của bạn"
                          style={{ cursor: 'text', outline: 'none' }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="email"
                          id="email"
                          value={session?.user?.email || ''}
                          disabled
                          className="pl-10 bg-gray-50 block w-full py-3 rounded-md border-gray-300 shadow-sm text-base cursor-not-allowed text-gray-500"
                          style={{ outline: 'none' }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500 flex items-center">
                        <FiShield className="mr-1" />
                        Email không thể thay đổi
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 text-right">
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className={`inline-flex justify-center items-center py-2.5 px-5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 ${
                      isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    whileHover={!isLoading ? { scale: 1.03 } : {}}
                    whileTap={!isLoading ? { scale: 0.98 } : {}}
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2 inline-block w-4 h-4 relative">
                          <div className="absolute top-0 left-0 w-full h-full border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2 h-4 w-4" />
                        Lưu thay đổi
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
          
          {activeTab === 'password' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleChangePassword}>
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                        Mật khẩu hiện tại
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          name="current-password"
                          id="current-password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          className="pl-10 pr-10 block w-full py-3 rounded-md border-gray-300 shadow-sm text-base"
                          placeholder="Nhập mật khẩu hiện tại"
                          style={{ cursor: 'text', outline: 'none' }}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="text-gray-400 hover:text-gray-600"
                            style={{ cursor: 'pointer', outline: 'none' }}
                          >
                            {showCurrentPassword ? (
                              <FiEyeOff className="h-5 w-5" />
                            ) : (
                              <FiEye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                        Mật khẩu mới
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiKey className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="new-password"
                          id="new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="pl-10 pr-10 block w-full py-3 rounded-md border-gray-300 shadow-sm text-base"
                          placeholder="Nhập mật khẩu mới"
                          style={{ cursor: 'text', outline: 'none' }}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="text-gray-400 hover:text-gray-600"
                            style={{ cursor: 'pointer', outline: 'none' }}
                          >
                            {showNewPassword ? (
                              <FiEyeOff className="h-5 w-5" />
                            ) : (
                              <FiEye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                        Xác nhận mật khẩu mới
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiKey className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirm-password"
                          id="confirm-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="pl-10 pr-10 block w-full py-3 rounded-md border-gray-300 shadow-sm text-base"
                          placeholder="Xác nhận mật khẩu mới"
                          style={{ cursor: 'text', outline: 'none' }}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="text-gray-400 hover:text-gray-600"
                            style={{ cursor: 'pointer', outline: 'none' }}
                          >
                            {showConfirmPassword ? (
                              <FiEyeOff className="h-5 w-5" />
                            ) : (
                              <FiEye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 flex items-center">
                        <FiShield className="mr-1" />
                        Mật khẩu mới phải có ít nhất 8 ký tự
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 text-right">
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className={`inline-flex justify-center items-center py-2.5 px-5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 ${
                      isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    whileHover={!isLoading ? { scale: 1.03 } : {}}
                    whileTap={!isLoading ? { scale: 0.98 } : {}}
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2 inline-block w-4 h-4 relative">
                          <div className="absolute top-0 left-0 w-full h-full border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <FiKey className="mr-2 h-4 w-4" />
                        Đổi mật khẩu
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </motion.div>
        
        {/* Error and Success messages */}
        {error && (
          <motion.div 
            className="mt-4 rounded-xl bg-red-50 p-4 border border-red-100 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </motion.div>
        )}
        
        {success && (
          <motion.div 
            className="mt-4 rounded-xl bg-green-50 p-4 border border-green-100 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <FiCheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">{success}</h3>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
} 