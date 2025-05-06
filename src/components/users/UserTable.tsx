import { User } from '@/types/user';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

interface UserTableProps {
  users: User[];
  currentUserId?: string;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  departmentNames?: Record<string, string>; // Map of department IDs to names
  currentPage?: number;
  itemsPerPage?: number;
}

export default function UserTable({ 
  users, 
  currentUserId, 
  onEdit, 
  onDelete, 
  departmentNames,
  currentPage = 1,
  itemsPerPage = 10
}: UserTableProps) {
  const getRoleName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị viên';
      case 'DEPARTMENT_HEAD':
        return 'Trưởng phòng';
      case 'EMPLOYEE':
        return 'Nhân viên';
      default:
        return role;
    }
  };

  // Get department name from ID
  const getDepartmentName = (user: User) => {
    // First check if there's a nested department object
    if (user.department) {
      return user.department.name;
    }
    
    // Fall back to using departmentId and departmentNames map
    if (!user.departmentId) return '--';
    return departmentNames?.[user.departmentId] || user.departmentId;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              STT
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tên người dùng
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phòng ban
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vai trò
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.length > 0 ? (
            users.map((user, index) => (
              <tr key={user.id} className="hover:bg-gray-50 transition duration-150">
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{getDepartmentName(user)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 
                      user.role === 'DEPARTMENT_HEAD' ? 'bg-blue-100 text-blue-800' : 
                      'bg-green-100 text-green-800'}`}>
                    {getRoleName(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-3 justify-end">
                    <button
                      onClick={() => onEdit(user)}
                      className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <FiEdit2 className="w-5 h-5" />
                    </button>
                    {user.id !== currentUserId && (
                      <button
                        onClick={() => onDelete(user)}
                        className="text-red-600 hover:text-red-900 cursor-pointer"
                        title="Xóa"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                Không tìm thấy người dùng nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
} 