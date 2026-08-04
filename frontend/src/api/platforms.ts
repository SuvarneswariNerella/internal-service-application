import api from "./client";

export interface AssetPlatform {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export const platformsApi = {
  list: () => api.get<{ success: boolean; data: AssetPlatform[] }>("/platforms"),
  create: (name: string) =>
    api.post<{ success: boolean; data: AssetPlatform }>("/platforms", { name }),
};
