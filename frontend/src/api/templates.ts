import api from './client';

export interface DesignTemplate {
  id: string;
  type: string;
  design: string;
  isDefault: boolean;
  title: string;
  description?: string;
  customHtml?: string;
  customCss?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export const templatesApi = {
  list: (workspaceId?: string, type?: string) => 
    api.get('/templates', { params: { workspaceId, type } }),
  
  get: (id: string) => 
    api.get(`/templates/${id}`),
  
  create: (data: Partial<DesignTemplate>) => 
    api.post('/templates', data),
  
  update: (id: string, data: Partial<DesignTemplate>) => 
    api.put(`/templates/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/templates/${id}`),
};
