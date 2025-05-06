export type UserRole = 'ADMIN' | 'DEPARTMENT_HEAD' | 'EMPLOYEE';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string | null;
  department?: Department;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  departmentId?: string | null;
}

export interface UserUpdateInput {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  departmentId?: string | null;
} 