'use client';

import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import DepartmentCreateModal from './DepartmentCreateModal';
import DepartmentEditModal from './DepartmentEditModal';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

interface Department {
  id: string;
  name: string;
  description: string | null;
}

export default function DepartmentTable() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [displayedDepartments, setDisplayedDepartments] = useState<Department[]>([]);

  const fetchDepartments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/departments');
      
      if (!response.ok) {
        throw new Error('Không thể tải danh sách phòng ban');
      }
      
      const data = await response.json();
      setDepartments(data);
      setTotalItems(data.length);
      updateDisplayedDepartments(data, currentPage, itemsPerPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải danh sách phòng ban');
    } finally {
      setIsLoading(false);
    }
  };

  const updateDisplayedDepartments = (allDepartments: Department[], page: number, perPage: number) => {
    const startIndex = (page - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, allDepartments.length);
    setDisplayedDepartments(allDepartments.slice(startIndex, endIndex));
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    updateDisplayedDepartments(departments, currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage, departments]);

  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage) return;
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setIsEditModalOpen(true);
  };

  const handleDelete = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDepartment) return;
    
    try {
      const response = await fetch(`/api/departments/${selectedDepartment.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Không thể xóa phòng ban');
      }
      
      // Remove from state and close modal
      const updatedDepartments = departments.filter((dept) => dept.id !== selectedDepartment.id);
      setDepartments(updatedDepartments);
      setTotalItems(updatedDepartments.length);
      setIsDeleteModalOpen(false);
      setSelectedDepartment(null);
    } catch (err) {
      console.error('Error deleting department:', err);
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi xóa phòng ban');
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 sm:p-6 flex justify-between items-center border-b">
        <h2 className="text-lg font-medium text-gray-900">Danh sách phòng ban</h2>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <FiPlus className="mr-2 -ml-1 h-4 w-4" />
          Thêm phòng ban
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 flex justify-center items-center">
          <div className="spinner border-4 border-gray-200 rounded-full border-t-orange-500 h-12 w-12 animate-spin"></div>
        </div>
      ) : departments.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-500">Chưa có phòng ban nào. Hãy tạo phòng ban mới.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên phòng ban
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedDepartments.map((department) => (
                <tr key={department.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {department.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {department.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(department)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <FiEdit2 className="h-4 w-4" />
                      <span className="sr-only">Chỉnh sửa</span>
                    </button>
                    <button
                      onClick={() => handleDelete(department)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FiTrash2 className="h-4 w-4" />
                      <span className="sr-only">Xóa</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center">
            <p className="text-sm font-medium text-gray-700 mr-4">
              Hiển thị <span className="font-semibold text-gray-900">{displayedDepartments.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> đến <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, totalItems)}</span> trong số <span className="font-semibold text-gray-900">{totalItems}</span> phòng ban
            </p>
            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="appearance-none pl-8 pr-10 py-2.5 bg-white border border-gray-300 rounded-md shadow-sm text-gray-800 font-medium focus:ring-orange-400 focus:border-orange-400 cursor-pointer"
              >
                <option value="5">5 / trang</option>
                <option value="10">10 / trang</option>
                <option value="25">25 / trang</option>
                <option value="50">50 / trang</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-orange-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50 cursor-pointer'}`}
              >
                <span className="sr-only">Previous</span>
                <FiChevronLeft className="h-5 w-5" />
              </button>
              
              {/* Generate page buttons */}
              {Array.from({ length: Math.max(1, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                // Show current page and neighbors, first and last page
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                
                // Add ellipsis if needed
                if (
                  totalPages > 3 && (
                  pageNum === 2 || 
                  pageNum === totalPages - 1)
                ) {
                  return (
                    <span
                      key={`ellipsis-${pageNum}`}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                    >
                      ...
                    </span>
                  );
                }
                
                return null;
              }).filter(Boolean)}
              
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50 cursor-pointer'}`}
              >
                <span className="sr-only">Next</span>
                <FiChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
        
        {/* Mobile pagination */}
        <div className="flex sm:hidden items-center justify-between w-full">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
          >
            Trước
          </button>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 mr-2">
              Trang {currentPage} / {Math.max(1, totalPages)}
            </span>
            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="appearance-none pl-8 pr-6 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-800 font-medium focus:ring-orange-400 focus:border-orange-400 cursor-pointer"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-orange-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
          >
            Tiếp
          </button>
        </div>
      </div>

      {/* Create Modal */}
      <DepartmentCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onDepartmentCreated={fetchDepartments}
      />

      {/* Edit Modal */}
      {selectedDepartment && (
        <DepartmentEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedDepartment(null);
          }}
          onDepartmentUpdated={fetchDepartments}
          department={selectedDepartment}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDepartment(null);
        }}
        onConfirm={confirmDelete}
        title="Xóa phòng ban"
        message={`Bạn có chắc chắn muốn xóa phòng ban "${selectedDepartment?.name}" không? Hành động này không thể hoàn tác.`}
      />
    </div>
  );
} 