import { create } from "zustand";
import { persist } from "zustand/middleware";
import { workspacesApi } from "@/api/workspaces";

interface WorkspaceState {
  globalWorkspaceId: string;
  setGlobalWorkspaceId: (id: string) => void;
  workspaces: any[];
  fetchWorkspaces: () => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      globalWorkspaceId: "",
      setGlobalWorkspaceId: (id) => set({ globalWorkspaceId: id }),
      workspaces: [],
      fetchWorkspaces: async () => {
        try {
          const response = await workspacesApi.list();
          set((state) => {
            const newState = { workspaces: response.data } as Partial<WorkspaceState>;
            if (!state.globalWorkspaceId) {
               if (response.data.length > 0) {
                 newState.globalWorkspaceId = response.data[0]?.id;
               }
            }
            return newState;
          });
        } catch (error) {
          console.error("Failed to fetch workspaces:", error);
        }
      },
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({ globalWorkspaceId: state.globalWorkspaceId }),
    }
  )
);
