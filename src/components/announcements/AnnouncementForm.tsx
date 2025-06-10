'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

type Department = {
  id: string;
  name: string;
};

interface AnnouncementFormProps {
  announcement?: {
    id: string;
    title: string;
    content: string;
    isPublic: boolean;
    departmentId: string | null;
  };
  isEditing?: boolean;
}

export default function AnnouncementForm({ announcement, isEditing = false }: AnnouncementFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPublic: false,
    departmentId: ''
  });
  
  const isAdmin = session?.user?.role === 'ADMIN';
  const isDepartmentHead = session?.user?.role === 'DEPARTMENT_HEAD';
  const isSystemAnnouncement = typeof window !== 'undefined' && window.location.pathname.includes('/admin/announcements');
  
  useEffect(() => {
    // Fetch departments for dropdown
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/departments');
        if (response.ok) {
          const departments = await response.json();
          
          if (Array.isArray(departments)) {
            // Admin sees all departments
            if (isAdmin) {
              setDepartments(departments);
            } 
            // Department head only sees their own department
            else if (isDepartmentHead && session?.user?.department) {
              const userDepartment = departments.find((dept: Department) => 
                dept.id === session.user.department
              );
              
              if (userDepartment) {
                setDepartments([userDepartment]);
                // Pre-select the department for department heads
                setFormData(prev => ({
                  ...prev,
                  departmentId: userDepartment.id
                }));
              } else {
                console.error('User department not found in departments list');
                setDepartments([]);
              }
            } 
            // Other users see all departments
            else {
              setDepartments(departments);
            }
          } else {
            setDepartments([]);
            console.error('Expected departments to be an array but got:', typeof departments);
          }
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast.error('Không thể tải danh sách phòng ban');
      }
    };
    
    // Only fetch departments if not a system announcement
    if (!isSystemAnnouncement) {
      fetchDepartments();
    } else if (isAdmin) {
      // For system announcements, initialize with isPublic = true
      setFormData(prev => ({
        ...prev,
        isPublic: true
      }));
    }
    
    // If editing, populate form with announcement data
    if (isEditing && announcement) {
      // Only allow editing if admin or if department head for this department
      if (isAdmin || (isDepartmentHead && session?.user?.department && announcement.departmentId === session?.user?.department)) {
        setFormData({
          title: announcement.title,
          content: announcement.content,
          isPublic: announcement.isPublic,
          departmentId: announcement.departmentId || ''
        });
      } else {
        toast.error('Bạn không có quyền chỉnh sửa thông báo này');
        router.back();
      }
    }
  }, [isEditing, announcement, session, isAdmin, isDepartmentHead, router, isSystemAnnouncement]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create a copy of form data that we can modify
      const submissionData = { ...formData };
      
      // If department head, ensure they can only create announcements for their department
      if (isDepartmentHead && session?.user?.department) {
        submissionData.departmentId = session.user.department;
      }
      
      // If admin user is accessing through the admin/announcements path, use system announcement API
      const isSystemAnnouncement = window.location.pathname.includes('/admin/announcements');
      
      const url = isEditing
        ? isSystemAnnouncement 
          ? `/api/announcements/system/${announcement?.id}`
          : `/api/announcements/${announcement?.id}`
        : isSystemAnnouncement
          ? '/api/announcements/system'
          : '/api/announcements';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(isSystemAnnouncement ? {...submissionData, isSystem: true} : submissionData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Đã xảy ra lỗi');
      }
      
      toast.success(isEditing ? 'Đã cập nhật thông báo' : 'Đã tạo thông báo mới');
      
      // Redirect based on announcement type
      router.push(isSystemAnnouncement ? '/admin/announcements' : '/manager/announcements');
      router.refresh();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Đã xảy ra lỗi khi lưu thông báo');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Tiêu đề: <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-700 shadow-sm sm:text-sm cursor-text focus:ring-1 focus:ring-orange-400 focus:border-orange-400 focus:outline-none transition duration-150"
          placeholder="Nhập tiêu đề thông báo"
        />
      </div>
      
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Nội dung: <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          name="content"
          rows={8}
          value={formData.content}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-700 shadow-sm sm:text-sm cursor-text focus:ring-1 focus:ring-orange-400 focus:border-orange-400 focus:outline-none transition duration-150"
          placeholder="Nhập nội dung thông báo"
        />
      </div>
      
      {!isSystemAnnouncement && (
        <div>
          <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700">
            Phòng ban:
          </label>
          {isDepartmentHead ? (
            <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 py-2 px-3 text-gray-700 sm:text-sm cursor-not-allowed">
              {departments && departments.length > 0 ? departments[0].name : 'Đang tải...'}
              <input type="hidden" name="departmentId" value={formData.departmentId} />
            </div>
          ) : (
            <select
              id="departmentId"
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              required={isAdmin}
              disabled={isDepartmentHead || (isAdmin && isSystemAnnouncement)}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-700 shadow-sm sm:text-sm cursor-pointer focus:ring-1 focus:ring-orange-400 focus:border-orange-400 focus:outline-none transition duration-150"
            >
              <option value="">-- Chọn phòng ban --</option>
              {departments && departments.map(department => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {isDepartmentHead 
              ? 'Thông báo sẽ chỉ được gửi trong phạm vi phòng ban của bạn' 
              : 'Nếu không chọn phòng ban, thông báo sẽ chỉ hiển thị khi được công khai'
            }
          </p>
        </div>
      )}
      
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="isPublic"
            name="isPublic"
            type="checkbox"
            checked={formData.isPublic}
            onChange={handleCheckboxChange}
            disabled={isSystemAnnouncement && isAdmin}
            className="h-4 w-4 rounded border-gray-300 text-orange-600 cursor-pointer focus:ring-1 focus:ring-orange-400 focus:outline-none transition duration-150"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="isPublic" className={`font-medium ${(isDepartmentHead || isSystemAnnouncement) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 cursor-pointer'}`}>
            Công khai thông báo
          </label>
          <p className={(isDepartmentHead || isSystemAnnouncement) ? 'text-gray-400' : 'text-gray-500'}>
            {isSystemAnnouncement 
              ? 'Thông báo hệ thống sẽ được công khai cho tất cả người dùng' 
              : 'Khi chọn công khai, thông báo sẽ hiển thị với tất cả người dùng'}
          </p>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 mr-3 focus:ring-1 focus:ring-orange-400 focus:border-orange-400 focus:outline-none transition duration-150"
        >
          Hủy bỏ
        </button>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:ring-1 focus:ring-orange-600 focus:outline-none transition duration-150 ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo thông báo'}
        </button>
      </div>
    </form>
  );
} 