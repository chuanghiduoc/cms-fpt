import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { FiAlertCircle, FiCheckCircle, FiXCircle, FiMessageSquare, FiClock, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';

type ReviewComment = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
};

type Post = {
  id: string;
  status: string;
  reviewedAt?: string;
  reviewedBy?: {
    id: string;
    name: string;
  };
};

interface ReviewPanelProps {
  post: Post;
  comments: ReviewComment[];
  onReviewSubmit: (status: string, comment: string) => Promise<void>;
  refreshComments: () => void;
}

export default function ReviewPanel({ post, comments, onReviewSubmit, refreshComments }: ReviewPanelProps) {
  const { data: session } = useSession();
  const [newComment, setNewComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canReview = session?.user?.role === 'DEPARTMENT_HEAD' || session?.user?.role === 'ADMIN';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <FiClock className="text-yellow-500 h-5 w-5" />;
      case 'APPROVED':
        return <FiCheckCircle className="text-green-500 h-5 w-5" />;
      case 'REJECTED':
        return <FiXCircle className="text-red-500 h-5 w-5" />;
      default:
        return <FiAlertCircle className="text-gray-500 h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'APPROVED':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'REJECTED':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Đang chờ duyệt';
      case 'APPROVED':
        return 'Đã duyệt';
      case 'REJECTED':
        return 'Đã từ chối';
      default:
        return 'Không xác định';
    }
  };

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

  const handleSubmitReview = async () => {
    if (!selectedStatus) {
      toast.error('Vui lòng chọn trạng thái duyệt');
      return;
    }

    try {
      setIsSubmitting(true);
      await onReviewSubmit(selectedStatus, newComment);
      setNewComment('');
      setSelectedStatus('');
      refreshComments();
      toast.success('Đã cập nhật trạng thái duyệt');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Đã xảy ra lỗi khi cập nhật trạng thái duyệt');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="border-b border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <FiMessageSquare className="mr-2 h-5 w-5 text-gray-500" />
          Phê duyệt bài viết
        </h3>
      </div>

      <div className="p-4">
        {/* Current status */}
        <div className={`p-4 mb-4 rounded-md border ${getStatusColor(post.status)}`}>
          <div className="flex items-center">
            {getStatusIcon(post.status)}
            <span className="ml-2 font-medium">Trạng thái: {getStatusName(post.status)}</span>
          </div>
          {post.reviewedBy && post.reviewedAt && (
            <div className="mt-2 text-sm">
              <p>Người duyệt: {post.reviewedBy.name}</p>
              <p>Thời gian: {formatDate(post.reviewedAt)}</p>
            </div>
          )}
        </div>

        {/* Review form for authorized users */}
        {canReview && (
          <div className="mt-4 border border-gray-200 rounded-md p-4">
            <h4 className="font-medium text-gray-700 mb-2">Cập nhật trạng thái</h4>
            
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStatus('APPROVED')}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
                    selectedStatus === 'APPROVED'
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FiCheckCircle className="mr-2 h-4 w-4" />
                  Duyệt
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('REJECTED')}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
                    selectedStatus === 'REJECTED'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FiXCircle className="mr-2 h-4 w-4" />
                  Từ chối
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('PENDING')}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
                    selectedStatus === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FiClock className="mr-2 h-4 w-4" />
                  Chờ duyệt
                </button>
              </div>
            </div>
            
            <div className="mt-3">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú (không bắt buộc)
              </label>
              <textarea
                id="comment"
                rows={3}
                placeholder="Nhập ghi chú về việc duyệt bài viết này..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-400 focus:border-orange-400"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              ></textarea>
            </div>
            
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={!selectedStatus || isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <FiSend className="mr-2 -ml-1 h-4 w-4" />
                    Cập nhật trạng thái
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Review comments list */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-700 mb-2">Lịch sử duyệt</h4>
          
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{comment.user.name}</p>
                        <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Chưa có ghi chú nào</p>
          )}
        </div>
      </div>
    </div>
  );
} 