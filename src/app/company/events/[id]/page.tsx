'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiCheck, FiX, FiInfo, FiUser } from 'react-icons/fi';
import { MdOutlineCorporateFare } from 'react-icons/md';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface EventParticipant {
  id: string;
  userId: string;
  eventId: string;
  status: 'CONFIRMED' | 'DECLINED' | 'PENDING';
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  createdById: string;
  departmentId?: string;
  isPublic: boolean;
  department?: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  participants: EventParticipant[];
}

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [userParticipation, setUserParticipation] = useState<'CONFIRMED' | 'DECLINED' | 'PENDING' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch event details
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && id) {
      fetchEventDetails();
    }
  }, [id, status, session]);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/events/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch event');
      }
      
      const data = await response.json();
      setEvent(data);
      
      // Check if user is a participant
      if (session?.user?.id) {
        const participant = data.participants.find(
          (p: EventParticipant) => p.userId === session.user.id
        );
        
        if (participant) {
          // Convert from lowercase in DB to uppercase for UI consistency
          setUserParticipation(participant.status.toUpperCase() as 'CONFIRMED' | 'DECLINED' | 'PENDING');
        } else {
          setUserParticipation('PENDING');
        }
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      toast.error('Không thể tải thông tin sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const handleParticipation = async (status: 'CONFIRMED' | 'DECLINED') => {
    if (!session?.user?.id || !event) return;
    
    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/events/${id}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: status.toLowerCase() }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update participation status');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUserParticipation(status);
        
        // Create updated participants list
        if (event) {
          const updatedParticipants = [...event.participants];
          const existingParticipantIndex = updatedParticipants.findIndex(
            p => p.userId === session.user?.id
          );
          
          if (existingParticipantIndex >= 0) {
            // Update existing participant status
            updatedParticipants[existingParticipantIndex] = {
              ...updatedParticipants[existingParticipantIndex],
              status: status
            };
          } else {
            // Add new participant
            updatedParticipants.push({
              id: `temp-${Date.now()}`, // Temporary ID until page refresh
              userId: session.user?.id as string,
              eventId: event.id,
              status: status,
              user: {
                id: session.user?.id as string,
                name: session.user?.name as string,
                email: session.user?.email as string
              }
            });
          }
          
          // Update event state with new participants list
          setEvent({
            ...event,
            participants: updatedParticipants
          });
        }
        
        toast.success(status === 'CONFIRMED' 
          ? 'Đã xác nhận tham gia sự kiện' 
          : 'Đã từ chối tham gia sự kiện');
      }
    } catch (error) {
      console.error('Error updating participation status:', error);
      toast.error('Không thể cập nhật trạng thái tham gia');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  // Format time for display
  const formatTime = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'HH:mm');
  };

  // Get participation status display
  const getParticipationStatus = () => {
    switch (userParticipation) {
      case 'CONFIRMED':
        return {
          label: 'Đã xác nhận tham gia',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          icon: <FiCheck className="h-4 w-4 mr-1.5" />
        };
      case 'DECLINED':
        return {
          label: 'Đã từ chối tham gia',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          icon: <FiX className="h-4 w-4 mr-1.5" />
        };
      case 'PENDING':
        return {
          label: 'Chưa xác nhận',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
          icon: <FiInfo className="h-4 w-4 mr-1.5" />
        };
      default:
        return {
          label: 'Chưa xác nhận',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          icon: <FiInfo className="h-4 w-4 mr-1.5" />
        };
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-6 pb-12">
        {/* Header Skeleton */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          {/* Event Header Skeleton */}
          <div className="bg-gradient-to-r from-orange-50 to-white p-6 sm:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div className="h-8 w-2/3 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-40 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Event Details Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Meta Info Skeleton */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Meta items skeleton */}
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start">
                    <div className="p-2 bg-gray-200 rounded-full mr-3 flex-shrink-0 h-9 w-9 animate-pulse"></div>
                    <div className="w-full">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
                
                {/* Actions skeleton */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Description and Participants Skeleton */}
          <div className="md:col-span-2 space-y-6">
            {/* Description Skeleton */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Participants Skeleton */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="bg-gray-200 rounded-full h-10 w-10 animate-pulse mr-3 flex-shrink-0"></div>
                      <div className="min-w-0 w-full">
                        <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
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
      <div className="w-full flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FiCalendar className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Sự kiện không tồn tại</h2>
        <p className="text-gray-600 mb-6 text-center max-w-md">Sự kiện bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <button
          onClick={() => router.push('/company/events')}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center shadow-sm"
        >
          <FiArrowLeft className="mr-2" /> Quay lại danh sách sự kiện
        </button>
      </div>
    );
  }

  const statusInfo = getParticipationStatus();
  const isEventPassed = new Date(event.endDate) < new Date();
  
  return (
    <div className="w-full space-y-6 pb-12">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <button
            onClick={() => router.back()}
            className="flex items-center text-orange-600 hover:text-orange-700 transition-colors font-medium"
          >
            <FiArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </button>
        </div>
        
        {/* Event Header */}
        <div className="bg-gradient-to-r from-orange-50 to-white p-6 sm:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
            
            <div className={`px-4 py-2 rounded-full inline-flex items-center text-sm font-medium ${statusInfo.bgColor} ${statusInfo.textColor} border ${statusInfo.borderColor}`}>
              {statusInfo.icon} {statusInfo.label}
            </div>
          </div>
          
          {/* Event Actions - Di chuyển xuống cuối phần metadata */}
        </div>
      </div>
      
      {/* Event Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Meta Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiInfo className="mr-2 text-orange-500" /> Thông tin
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-start">
                <div className="p-2 bg-orange-50 rounded-full mr-3 flex-shrink-0">
                  <FiCalendar className="text-orange-500 h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ngày</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(event.startDate)}
                    {formatDate(event.startDate) !== formatDate(event.endDate) && (
                      <> đến {formatDate(event.endDate)}</>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-orange-50 rounded-full mr-3 flex-shrink-0">
                  <FiClock className="text-orange-500 h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Thời gian</p>
                  <p className="font-medium text-gray-900">
                    {formatTime(event.startDate)} - {formatTime(event.endDate)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-orange-50 rounded-full mr-3 flex-shrink-0">
                  <FiMapPin className="text-orange-500 h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Địa điểm</p>
                  <p className="font-medium text-gray-900">{event.location || 'Chưa cập nhật'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-orange-50 rounded-full mr-3 flex-shrink-0">
                  <FiUser className="text-orange-500 h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Người tạo</p>
                  <p className="font-medium text-gray-900">{event.createdBy.name}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-orange-50 rounded-full mr-3 flex-shrink-0">
                  <MdOutlineCorporateFare className="text-orange-500 h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phòng ban</p>
                  <p className="font-medium text-gray-900">{event.department?.name || 'Toàn công ty'}</p>
                </div>
              </div>
              
              {/* Event Actions - Được di chuyển xuống đây */}
              {!isEventPassed && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-3">Trạng thái tham gia</p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleParticipation('CONFIRMED')}
                      disabled={submitting || userParticipation === 'CONFIRMED'}
                      className={`w-full py-2 rounded-lg flex items-center justify-center text-sm font-medium transition-colors shadow-sm ${
                        userParticipation === 'CONFIRMED' 
                          ? 'bg-green-50 text-green-700 border border-green-200 cursor-default' 
                          : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                      }`}
                    >
                      {submitting ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <>
                          <FiCheck className="mr-1.5 h-4 w-4" /> 
                          {userParticipation === 'CONFIRMED' ? 'Đã xác nhận tham gia' : 'Tham gia sự kiện'}
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleParticipation('DECLINED')}
                      disabled={submitting || userParticipation === 'DECLINED'}
                      className={`w-full py-2 rounded-lg flex items-center justify-center text-sm font-medium transition-colors shadow-sm ${
                        userParticipation === 'DECLINED' 
                          ? 'bg-red-50 text-red-700 border border-red-200 cursor-default' 
                          : 'bg-white text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50'
                      }`}
                    >
                      {submitting ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <>
                          <FiX className="mr-1.5 h-4 w-4" /> 
                          {userParticipation === 'DECLINED' ? 'Đã từ chối tham gia' : 'Từ chối tham gia'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              {isEventPassed && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <p className="text-gray-500 text-sm">Sự kiện đã kết thúc</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column - Description and Participants */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiInfo className="mr-2 text-orange-500" /> Chi tiết sự kiện
              </h2>
            </div>
            
            <div className="p-6">
              <div className="prose prose-orange prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-orange-600 prose-strong:text-gray-900 w-full">
                {event.description ? (
                  <div dangerouslySetInnerHTML={{ __html: event.description }} />
                ) : (
                  <p className="text-gray-500 italic">Không có thông tin chi tiết</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Participants */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FiUser className="mr-2 text-orange-500" /> Người tham gia ({event.participants.filter(p => p.status.toUpperCase() === 'CONFIRMED').length})
              </h2>
            </div>
            
            <div className="p-6">
              {event.participants.filter(p => p.status.toUpperCase() === 'CONFIRMED').length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {event.participants
                    .filter(p => p.status.toUpperCase() === 'CONFIRMED')
                    .map((participant) => (
                      <div key={participant.id} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-orange-200 transition-colors">
                        <div className="bg-orange-100 text-orange-600 rounded-full h-10 w-10 flex items-center justify-center font-medium mr-3 flex-shrink-0">
                          {participant.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{participant.user.name}</p>
                          <p className="text-sm text-gray-500 truncate">{participant.user.email}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-3">
                    <FiUser className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500">Chưa có người tham gia sự kiện này</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 