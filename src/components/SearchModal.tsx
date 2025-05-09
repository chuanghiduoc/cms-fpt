import { Fragment, useEffect, useCallback, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  FiSearch,
  FiX,
  FiFileText,
  FiCalendar,
  FiBell,
  FiDownload,
  FiExternalLink,
  FiChevronRight,
  FiChevronLeft,
  FiAlertCircle,
  FiInfo,
  FiEdit,
} from 'react-icons/fi';
import Link from 'next/link';
import { format } from 'date-fns';
import { useSearch } from '@/hooks/useSearch';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryMapping: Record<string, { label: string; bgClass: string; textClass: string }> = {
  REPORT: { label: 'Báo cáo', bgClass: 'bg-blue-100', textClass: 'text-blue-800' },
  CONTRACT: { label: 'Hợp đồng', bgClass: 'bg-green-100', textClass: 'text-green-800' },
  GUIDE: { label: 'Hướng dẫn', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
  FORM: { label: 'Biểu mẫu', bgClass: 'bg-purple-100', textClass: 'text-purple-800' },
  OTHER: { label: 'Khác', bgClass: 'bg-gray-100', textClass: 'text-gray-800' },
};

// Format date for display
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return format(date, 'dd/MM/yyyy');
};

// Format date and time for events
const formatDateTime = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return format(date, 'HH:mm - dd/MM/yyyy');
};

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const {
    query,
    setQuery,
    results,
    loading,
    error,
    page,
    searchType,
    handleSearchTypeChange,
    handlePageChange,
  } = useSearch();

  // Close on Escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, onClose]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen, setQuery]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    [setQuery]
  );

  // Handle keyboard shortcut hints for search results
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // If user presses the '/' key at the start of the search, clear the input
    if (e.key === '/' && query === '') {
      e.preventDefault();
    }
    
    // Allow keyboard navigation between results in the future
  }, [query]);

  // Render document results
  const renderDocuments = () => {
    if (!results?.documents.length) return null;

    return (
      <div className="mt-6">
        <h3 className="text-md font-semibold text-gray-900 flex items-center">
          <FiFileText className="mr-2 text-blue-600" />
          Tài liệu
          {results.pagination.totalDocuments > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({results.pagination.totalDocuments})
            </span>
          )}
        </h3>
        <div className="mt-2">
          <AnimatePresence>
            {results.documents.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                exit={{ opacity: 0 }}
                className="mb-3 bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition duration-150 hover:border-blue-300"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium">{doc.title}</h4>
                    {doc.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{doc.description}</p>
                    )}
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <span className="mr-3 flex items-center">
                        <FiInfo className="mr-1" />
                        {doc.department?.name || 'Công ty'}
                      </span>
                      <span className="flex items-center">
                        <FiCalendar className="mr-1" />
                        {formatDate(doc.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span 
                      className={`px-2 py-1 rounded-full text-xs ${
                        categoryMapping[doc.category]?.bgClass || 'bg-gray-100'
                      } ${categoryMapping[doc.category]?.textClass || 'text-gray-800'}`}
                    >
                      {categoryMapping[doc.category]?.label || doc.category}
                    </span>
                    <a 
                      href={doc.filePath}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="ml-3 text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded-full transition-colors"
                      title="Tải xuống"
                    >
                      <FiDownload />
                    </a>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100 text-right">
                  <Link 
                    href={`/company/documents/${doc.id}`}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center justify-end"
                    onClick={onClose}
                  >
                    Xem chi tiết <FiChevronRight className="ml-1" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {searchType === 'documents' && results.pagination.totalDocuments > results.documents.length && (
            <div className="text-center mt-4">
              <Link
                href={`/company/documents?search=${encodeURIComponent(query)}`}
                className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center p-2 hover:bg-blue-50 rounded-md transition-colors"
                onClick={onClose}
              >
                Xem tất cả kết quả tài liệu <FiExternalLink className="ml-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render event results
  const renderEvents = () => {
    if (!results?.events.length) return null;

    return (
      <div className="mt-6">
        <h3 className="text-md font-semibold text-gray-900 flex items-center">
          <FiCalendar className="mr-2 text-green-600" />
          Sự kiện 
          {results.pagination.totalEvents > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({results.pagination.totalEvents})
            </span>
          )}
        </h3>
        <div className="mt-2">
          <AnimatePresence>
            {results.events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                exit={{ opacity: 0 }}
                className="mb-3 bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition duration-150 hover:border-green-300"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium">{event.title}</h4>
                    {event.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                    )}
                    <div className="flex flex-col mt-2 text-xs text-gray-500">
                      <div className="flex items-center">
                        <span className="font-medium mr-1 flex items-center">
                          <FiCalendar className="mr-1" /> Bắt đầu:
                        </span> 
                        <span>{formatDateTime(event.startDate)}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="font-medium mr-1 flex items-center">
                          <FiInfo className="mr-1" /> Địa điểm:
                        </span> 
                        <span>{event.location || 'Không xác định'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {event.department?.name || 'Công ty'}
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100 text-right">
                  <Link 
                    href={`/company/events/${event.id}`}
                    className="text-xs text-green-600 hover:text-green-800 flex items-center justify-end"
                    onClick={onClose}
                  >
                    Xem chi tiết <FiChevronRight className="ml-1" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {searchType === 'events' && results.pagination.totalEvents > results.events.length && (
            <div className="text-center mt-4">
              <Link
                href={`/company/events?search=${encodeURIComponent(query)}`}
                className="text-sm text-green-600 hover:text-green-800 inline-flex items-center p-2 hover:bg-green-50 rounded-md transition-colors"
                onClick={onClose}
              >
                Xem tất cả kết quả sự kiện <FiExternalLink className="ml-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render announcement results
  const renderAnnouncements = () => {
    if (!results?.announcements.length) return null;

    return (
      <div className="mt-6">
        <h3 className="text-md font-semibold text-gray-900 flex items-center">
          <FiBell className="mr-2 text-yellow-600" />
          Thông báo
          {results.pagination.totalAnnouncements > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({results.pagination.totalAnnouncements})
            </span>
          )}
        </h3>
        <div className="mt-2">
          <AnimatePresence>
            {results.announcements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                exit={{ opacity: 0 }}
                className="mb-3 bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition duration-150 hover:border-yellow-300"
              >
                <div>
                  <h4 className="text-sm font-medium">{announcement.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{announcement.content}</p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <span className="mr-3 flex items-center">
                      <FiInfo className="mr-1" />
                      {announcement.department?.name || 'Công ty'}
                    </span>
                    <span className="flex items-center">
                      <FiCalendar className="mr-1" />
                      {formatDate(announcement.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100 text-right">
                  <Link 
                    href={`/company/announcements/${announcement.id}`}
                    className="text-xs text-yellow-600 hover:text-yellow-800 flex items-center justify-end"
                    onClick={onClose}
                  >
                    Xem chi tiết <FiChevronRight className="ml-1" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {searchType === 'announcements' && results.pagination.totalAnnouncements > results.announcements.length && (
            <div className="text-center mt-4">
              <Link
                href={`/company/announcements?search=${encodeURIComponent(query)}`}
                className="text-sm text-yellow-600 hover:text-yellow-800 inline-flex items-center p-2 hover:bg-yellow-50 rounded-md transition-colors"
                onClick={onClose}
              >
                Xem tất cả kết quả thông báo <FiExternalLink className="ml-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render post results
  const renderPosts = () => {
    if (!results?.posts.length) return null;

    return (
      <div className="mt-6">
        <h3 className="text-md font-semibold text-gray-900 flex items-center">
          <FiFileText className="mr-2 text-orange-600" />
          Tin tức
          {results.pagination.totalPosts > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({results.pagination.totalPosts})
            </span>
          )}
        </h3>
        <div className="mt-2">
          <AnimatePresence>
            {results.posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                exit={{ opacity: 0 }}
                className="mb-3 bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition duration-150 hover:border-orange-300"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium">{post.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {post.content.replace(/<[^>]*>?/gm, '').substring(0, 120)}...
                    </p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <span className="mr-3 flex items-center">
                        <FiInfo className="mr-1" />
                        {post.department?.name || 'Công ty'}
                      </span>
                      <span className="flex items-center">
                        <FiCalendar className="mr-1" />
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {post.tags && post.tags.length > 0 && (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {post.tags[0]}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100 text-right">
                  <Link 
                    href={`/company/posts/${post.id}`}
                    className="text-xs text-orange-600 hover:text-orange-800 flex items-center justify-end"
                    onClick={onClose}
                  >
                    Xem bài viết <FiChevronRight className="ml-1" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {searchType === 'posts' && results.pagination.totalPosts > results.posts.length && (
            <div className="text-center mt-4">
              <Link
                href={`/company/posts?search=${encodeURIComponent(query)}`}
                className="text-sm text-orange-600 hover:text-orange-800 inline-flex items-center p-2 hover:bg-orange-50 rounded-md transition-colors"
                onClick={onClose}
              >
                Xem tất cả kết quả tin tức <FiExternalLink className="ml-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render pagination controls for specific content type views
  const renderPagination = () => {
    if (!results || searchType === 'all') return null;

    const totalItems = 
      searchType === 'documents' 
        ? results.pagination.totalDocuments 
        : searchType === 'events'
          ? results.pagination.totalEvents
          : results.pagination.totalAnnouncements;

    if (totalItems <= results.pagination.limit) return null;

    return (
      <div className="flex justify-center mt-6">
        <nav className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className={`p-2 rounded-md mr-2 ${
              page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-label="Trang trước"
            title="Trang trước"
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm text-gray-700">
            Trang {page} / {results.pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= results.pagination.totalPages}
            className={`p-2 rounded-md ml-2 ${
              page >= results.pagination.totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-label="Trang sau"
            title="Trang sau"
          >
            <FiChevronRight className="h-5 w-5" />
          </button>
        </nav>
      </div>
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-16 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-xl bg-white p-6 shadow-2xl transition duration-150">
                <div className="flex justify-between items-center">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 flex items-center">
                    <FiSearch className="mr-2 text-orange-500" />
                    Tìm kiếm
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 p-1 rounded-full transition-colors"
                    onClick={onClose}
                    aria-label="Đóng"
                    title="Đóng (Esc)"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 relative">
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={query}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="block w-full rounded-lg border border-gray-300 pl-11 pr-4 py-3 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-base shadow-sm"
                      placeholder="Tìm kiếm tài liệu, thông báo, sự kiện..."
                      aria-label="Nhập từ khóa tìm kiếm"
                    />
                    {query && (
                      <button
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        onClick={() => setQuery('')}
                        aria-label="Xóa"
                        title="Xóa tìm kiếm"
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() => handleSearchTypeChange('all')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full flex items-center ${
                        searchType === 'all'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FiSearch className="mr-1" />
                      Tất cả
                    </button>
                    <button
                      onClick={() => handleSearchTypeChange('documents')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full flex items-center ${
                        searchType === 'documents'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      <FiFileText className="mr-1" />
                      Tài liệu
                    </button>
                    <button
                      onClick={() => handleSearchTypeChange('events')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full flex items-center ${
                        searchType === 'events'
                          ? 'bg-green-600 text-white'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      <FiCalendar className="mr-1" />
                      Sự kiện
                    </button>
                    <button
                      onClick={() => handleSearchTypeChange('announcements')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full flex items-center ${
                        searchType === 'announcements'
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                      }`}
                    >
                      <FiBell className="mr-1" />
                      Thông báo
                    </button>
                    <button
                      onClick={() => handleSearchTypeChange('posts')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full flex items-center ${
                        searchType === 'posts'
                          ? 'bg-orange-600 text-white'
                          : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                      }`}
                    >
                      <FiEdit className="mr-1" />
                      Tin tức
                    </button>
                  </div>
                </div>

                <div className="mt-4 max-h-[60vh] overflow-y-auto p-1 custom-scrollbar">
                  {loading ? (
                    <div className="py-10 text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]"></div>
                      <p className="mt-2 text-sm text-gray-500">Đang tìm kiếm...</p>
                    </div>
                  ) : error ? (
                    <div className="py-10 text-center bg-red-50 rounded-lg">
                      <FiAlertCircle className="h-10 w-10 text-red-500 mx-auto" />
                      <p className="mt-4 text-red-600 font-medium">{error}</p>
                      <p className="mt-1 text-sm text-red-500">Vui lòng thử lại sau</p>
                    </div>
                  ) : query && !results?.documents.length && !results?.events.length && !results?.announcements.length && !results?.posts.length ? (
                    <div className="py-10 text-center bg-gray-50 rounded-lg">
                      <FiSearch className="h-10 w-10 text-gray-400 mx-auto" />
                      <p className="mt-4 text-gray-600 font-medium">Không tìm thấy kết quả nào cho &ldquo;{query}&rdquo;</p>
                      <p className="mt-1 text-sm text-gray-500">Hãy thử tìm kiếm với từ khóa khác</p>
                    </div>
                  ) : query ? (
                    <div>
                      {searchType === 'all' || searchType === 'documents' ? renderDocuments() : null}
                      {searchType === 'all' || searchType === 'events' ? renderEvents() : null}
                      {searchType === 'all' || searchType === 'announcements' ? renderAnnouncements() : null}
                      {searchType === 'all' || searchType === 'posts' ? renderPosts() : null}
                      {renderPagination()}
                      
                      {searchType === 'all' && results && results.pagination.total > 0 && (
                        <div className="mt-6 text-center">
                          <p className="text-sm text-gray-500 mb-2">
                            Tìm thấy {results.pagination.total} kết quả cho &ldquo;{query}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-10 text-center bg-gray-50 rounded-lg">
                      <FiSearch className="h-10 w-10 text-gray-400 mx-auto" />
                      <p className="mt-4 text-gray-600 font-medium">Nhập từ khóa để tìm kiếm</p>
                      <p className="mt-1 text-sm text-gray-500">Bạn có thể tìm kiếm tài liệu, thông báo và sự kiện</p>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default SearchModal; 