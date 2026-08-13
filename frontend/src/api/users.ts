import api from "./client";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export const usersApi = {
  list: () => api.get<{ success: boolean; data: User[] }>("/users"),
};
