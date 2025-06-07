'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiCalendar, FiMapPin, FiClock, FiArrowLeft, FiEdit2, FiTrash2, 
  FiPlus, FiCheck, FiX, FiLoader, FiUsers, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

interface EventParticipant {
  id: string;
  userId: string;
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface EventDetails {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  department?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  participants?: EventParticipant[];
}

interface DepartmentUser {
  id: string;
  name: string;
  email: string;
}

interface RouteParams {
  id: string;
}

export default function EventDetailsPage({ params }: { params: Promise<RouteParams> }) {
  // Sử dụng React.use() để unwrap params object theo khuyến nghị của Next.js
  const safeParams = use(params);
  const eventId = safeParams.id;
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [departmentUsers, setDepartmentUsers] = useState<DepartmentUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<DepartmentUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [processingInvite, setProcessingInvite] = useState(false);
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [usersPerPage] = useState(5);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentParticipantPage, setCurrentParticipantPage] = useState(1);
  const [participantsPerPage] = useState(10);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchEventDetails();
    }
  }, [status, eventId, router]);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Sự kiện không tồn tại');
          router.push('/manager/events');
          return;
        }
        throw new Error('Failed to fetch event details');
      }
      
      const data = await response.json();
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event details:', error);
      toast.error('Đã xảy ra lỗi khi tải thông tin sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentUsers = async () => {
    try {
      if (!session?.user?.department) {
        return;
      }
      
      const response = await fetch(`/api/departments/${session.user.department}/users`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch department users');
      }
      
      const data = await response.json();
      
      // Filter out already invited users
      const currentParticipants = event?.participants?.map(p => p.userId) || [];
      const filteredUsers = data.filter((user: DepartmentUser) => !currentParticipants.includes(user.id));
      
      setDepartmentUsers(filteredUsers);
      setFilteredUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching department users:', error);
      toast.error('Đã xảy ra lỗi khi tải danh sách người dùng');
    }
  };

  const handleDeleteEvent = async () => {
    try {
      const response = await fetch(`/api/events/${event?.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      
      toast.success('Đã xóa sự kiện thành công');
      router.push('/manager/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Đã xảy ra lỗi khi xóa sự kiện');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const openInviteModal = () => {
    fetchDepartmentUsers();
    setInviteModalOpen(true);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleInviteUsers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Vui lòng chọn ít nhất một người');
      return;
    }
    
    setProcessingInvite(true);
    
    try {
      const invitePromises = selectedUsers.map(userId => 
        fetch(`/api/events/${event?.id}/participants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, status: 'pending' })
        })
      );
      
      await Promise.all(invitePromises);
      
      toast.success(`Đã mời ${selectedUsers.length} người tham gia sự kiện`);
      setSelectedUsers([]);
      setInviteModalOpen(false);
      fetchEventDetails(); // Refresh the event data
    } catch (error) {
      console.error('Error inviting users:', error);
      toast.error('Đã xảy ra lỗi khi mời người tham gia');
    } finally {
      setProcessingInvite(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
  };

  // Hàm tính toán danh sách người dùng hiển thị theo trang hiện tại
  const getPaginatedUsers = () => {
    const indexOfLastUser = currentUserPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    return filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  };

  // Tính tổng số trang
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Hàm tính toán danh sách người tham gia hiển thị theo trang hiện tại
  const getPaginatedParticipants = () => {
    if (!event?.participants) return [];
    const indexOfLastParticipant = currentParticipantPage * participantsPerPage;
    const indexOfFirstParticipant = indexOfLastParticipant - participantsPerPage;
    return event.participants.slice(indexOfFirstParticipant, indexOfLastParticipant);
  };

  // Tính tổng số trang cho người tham gia
  const totalParticipantPages = event?.participants 
    ? Math.ceil(event.participants.length / participantsPerPage) 
    : 0;

  // Thay đổi trang người tham gia
  const handleParticipantPageChange = (pageNumber: number) => {
    setCurrentParticipantPage(pageNumber);
  };

  // Thay đổi trang
  const handleUserPageChange = (pageNumber: number) => {
    setCurrentUserPage(pageNumber);
  };

  // Handle search query change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredUsers(departmentUsers);
    } else {
      const filtered = departmentUsers.filter(
        user => 
          user.name.toLowerCase().includes(query) || 
          user.email.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
    // Reset lại trang về 1 khi tìm kiếm
    setCurrentUserPage(1);
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        {/* Header with back button skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-5 h-5 mr-4 bg-gray-200 rounded animate-pulse"></div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <div className="w-6 h-6 mr-2 bg-gray-200 rounded-full animate-pulse"></div>
              Chi tiết sự kiện
            </h1>
          </div>
          <div className="flex space-x-3">
            <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Event details skeleton */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <div className="h-6 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="text-right">
              <div className="h-5 w-36 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <div className="mb-4">
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="mt-6 border-t pt-6">
                    <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-3"></div>
                    <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-3"></div>
                    
                    <div className="space-y-3">
                      <div className="bg-gray-100 p-3 rounded-lg flex justify-between items-center">
                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      
                      {/* Participants list skeleton */}
                      <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 overflow-hidden">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center p-3 bg-white">
                            <div className="flex items-center min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 mr-3"></div>
                              <div className="min-w-0 flex-1">
                                <div className="h-5 w-36 bg-gray-200 rounded animate-pulse mb-1"></div>
                                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                              </div>
                            </div>
                            <div className="ml-2 flex-shrink-0">
                              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Time and location skeleton */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-5 h-5 mt-1 mr-3 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="w-5 h-5 mt-1 mr-3 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="h-5 w-36 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="w-5 h-5 mt-1 mr-3 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-800">Không tìm thấy sự kiện.</p>
          <Link href="/manager/events" className="mt-4 inline-block text-orange-600 hover:text-orange-700">
            Quay lại danh sách sự kiện
          </Link>
        </div>
      </div>
    );
  }

  const isCreator = session?.user?.id === event.createdBy?.id;
  const isDepartmentHead = session?.user?.role === 'DEPARTMENT_HEAD' && 
    session?.user?.department === event.department?.id;
  const canEdit = isCreator || isDepartmentHead || session?.user?.role === 'ADMIN';

  return (
    <div className="space-y-6 pb-8">      
      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteEvent}
        title="Xóa sự kiện"
        message="Bạn có chắc chắn muốn xóa sự kiện này? Hành động này không thể hoàn tác."
      />
      
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href="/manager/events" 
            className="mr-4 text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            {/* <FiCalendar className="mr-2 h-6 w-6 text-orange-500" /> */}
            Chi tiết sự kiện
          </h1>
        </div>
        
        {canEdit && (
          <div className="flex space-x-3">
            <Link 
              href={`/manager/events/edit/${event.id}`} 
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 cursor-pointer"
            >
              <FiEdit2 className="mr-2 -ml-0.5 h-4 w-4" />
              Chỉnh sửa
            </Link>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
            >
              <FiTrash2 className="mr-2 -ml-0.5 h-4 w-4" />
              Xóa
            </button>
          </div>
        )}
      </div>
      
      {/* Event details */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {event.title}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                event.isPublic ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {event.isPublic ? 'Công khai' : 'Nội bộ'}
              </span>
              
              {event.department && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {event.department.name}
                </span>
              )}
            </p>
          </div>
          <div className="text-sm text-gray-600">
            Tạo bởi {event.createdBy?.name || 'Không xác định'} vào {formatDateTime(event.createdAt)}
            {event.updatedAt !== event.createdAt && (
              <div className="text-gray-500">
                Cập nhật lần cuối: {formatDateTime(event.updatedAt)}
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="prose max-w-none">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Thông tin sự kiện</h3>
                  <div className="whitespace-pre-wrap text-gray-700">{event.description}</div>
                </div>
                
                <div className="mt-6 border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Người tham gia</h3>
                  
                  {canEdit && (
                    <button
                      onClick={openInviteModal}
                      className="mb-3 inline-flex items-center px-3 py-1.5 border border-orange-300 text-sm font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none cursor-pointer transition duration-150"
                    >
                      <FiPlus className="mr-1" /> Mời thêm người tham gia
                    </button>
                  )}
                  
                  {event.participants && event.participants.length > 0 ? (
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center text-sm font-medium text-gray-600">
                        <div className="flex-1">Thông tin người tham gia</div>
                        <div className="w-24 text-center">Trạng thái</div>
                      </div>
                      
                      <div className="overflow-hidden border border-gray-200 rounded-lg divide-y divide-gray-200">
                        {getPaginatedParticipants().map(participant => (
                          <div key={participant.id} className="flex items-center p-3 bg-white hover:bg-gray-50 transition-colors cursor-default">
                            <div className="flex items-center min-w-0 flex-1">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 text-gray-600">
                                <span className="text-sm font-medium">
                                  {participant.user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 truncate">{participant.user.name}</div>
                                <div className="text-xs text-gray-500 truncate">{participant.user.email}</div>
                              </div>
                            </div>
                            <div className="ml-2 flex-shrink-0 w-24 text-center">
                              <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium w-full ${
                                participant.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                                participant.status === 'declined' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {participant.status === 'accepted' ? 'Tham gia' : 
                                participant.status === 'declined' ? 'Từ chối' : 
                                'Đang chờ'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Tổng cộng: {event.participants.length} người
                        </div>
                        
                        {totalParticipantPages > 1 && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleParticipantPageChange(Math.max(1, currentParticipantPage - 1))}
                              disabled={currentParticipantPage === 1}
                              className={`p-1 rounded-md ${
                                currentParticipantPage === 1 
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : 'text-gray-600 hover:bg-gray-100 cursor-pointer'
                              }`}
                              aria-label="Trang trước"
                            >
                              <FiChevronLeft className="w-4 h-4" />
                            </button>
                            
                            <div className="text-xs font-medium text-gray-700">
                              Trang {currentParticipantPage} / {totalParticipantPages}
                            </div>
                            
                            <button
                              onClick={() => handleParticipantPageChange(Math.min(totalParticipantPages, currentParticipantPage + 1))}
                              disabled={currentParticipantPage === totalParticipantPages}
                              className={`p-1 rounded-md ${
                                currentParticipantPage === totalParticipantPages 
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : 'text-gray-600 hover:bg-gray-100 cursor-pointer'
                              }`}
                              aria-label="Trang tiếp theo"
                            >
                              <FiChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 p-4 border border-gray-200 rounded-md text-center">
                      <FiUsers className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                      Chưa có ai tham gia sự kiện này
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Thời gian & Địa điểm</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <FiCalendar className="mt-1 w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Ngày diễn ra</div>
                      <div className="text-gray-700">{formatDate(event.startDate)}</div>
                      {formatDate(event.startDate) !== formatDate(event.endDate) && (
                        <div className="text-gray-700">đến {formatDate(event.endDate)}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FiClock className="mt-1 w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Thời gian</div>
                      <div className="text-gray-700">
                        {formatTime(event.startDate)} - {formatTime(event.endDate)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FiMapPin className="mt-1 w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Địa điểm</div>
                      <div className="text-gray-700">{event.location || 'Chưa có địa điểm'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Invite modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-gray-600/75 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Mời người tham gia</h3>
              <button 
                onClick={() => setInviteModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 transition duration-150 cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {departmentUsers.length > 0 ? (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Chọn người tham gia từ phòng ban của bạn
                    </div>
                    <div className="text-sm font-medium text-orange-600">
                      {selectedUsers.length} đã chọn
                    </div>
                  </div>
                  
                  <div className="mb-3 relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FiSearch className="w-4 h-4" />
                    </div>
                    <input 
                      type="text"
                      placeholder="Tìm kiếm người dùng..."
                      className="w-full pl-9 pr-3 rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none transition duration-150"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                  </div>
                  
                  <div className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
                    {filteredUsers.length > 0 ? (
                      getPaginatedUsers().map(user => (
                        <div 
                          key={user.id} 
                          className={`flex items-center p-3 cursor-pointer transition duration-150 ${
                            selectedUsers.includes(user.id) 
                              ? 'bg-orange-50' 
                              : 'bg-white hover:bg-gray-50'
                          }`}
                          onClick={() => toggleUserSelection(user.id)}
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3 text-gray-600">
                              <span className="text-sm font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                              <div className="text-xs text-gray-500 truncate">{user.email}</div>
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0">
                            <input 
                              type="checkbox" 
                              checked={selectedUsers.includes(user.id)}
                              readOnly
                              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <p className="mb-1">Không tìm thấy người dùng</p>
                        <p className="text-sm">Vui lòng thử tìm kiếm với từ khóa khác</p>
                      </div>
                    )}
                  </div>

                  {/* Phân trang */}
                  {filteredUsers.length > 0 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-xs text-gray-500">
                        Hiển thị {getPaginatedUsers().length} trên {filteredUsers.length} người dùng
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleUserPageChange(Math.max(1, currentUserPage - 1))}
                          disabled={currentUserPage === 1}
                          className={`p-1 rounded-md ${
                            currentUserPage === 1 
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-gray-600 hover:bg-gray-100 cursor-pointer'
                          }`}
                          aria-label="Trang trước"
                        >
                          <FiChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <div className="text-xs font-medium text-gray-700">
                          Trang {currentUserPage} / {totalUserPages}
                        </div>
                        
                        <button
                          onClick={() => handleUserPageChange(Math.min(totalUserPages, currentUserPage + 1))}
                          disabled={currentUserPage === totalUserPages}
                          className={`p-1 rounded-md ${
                            currentUserPage === totalUserPages 
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-gray-600 hover:bg-gray-100 cursor-pointer'
                          }`}
                          aria-label="Trang tiếp theo"
                        >
                          <FiChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiUsers className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-base">Không còn người dùng để mời</p>
                  <p className="text-sm mt-1">Tất cả người dùng trong phòng ban đã được mời.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
              <button 
                onClick={() => setInviteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleInviteUsers}
                disabled={processingInvite || selectedUsers.length === 0}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150 flex items-center ${
                  processingInvite || selectedUsers.length === 0 ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                {processingInvite ? (
                  <>
                    <FiLoader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <FiCheck className="mr-2" />
                    Mời ({selectedUsers.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 