export type Role = "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER" | "ACCOUNTS" | "OPERATIONS";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: PaginationMeta;
}
