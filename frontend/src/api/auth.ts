import api from "./client";
import type { ApiResponse, AuthResponse, User } from "@/types";

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>("/auth/login", { email, password }),

  register: (data: { email: string; password: string; name: string; role?: string }) =>
    api.post<ApiResponse<AuthResponse>>("/auth/register", data),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<AuthResponse>>("/auth/refresh", { refreshToken }),

  me: () => api.get<ApiResponse<User>>("/auth/me"),
};
