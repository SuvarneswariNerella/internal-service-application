import api from "./client";

export interface ItemCode {
  id: string;
  name: string;
  code: string;
  description: string | null;
  type: string;
}

export const itemsApi = {
  list: () => api.get<{ success: boolean; data: ItemCode[] }>("/items"),
};
