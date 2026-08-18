import api from './client';

export interface SystemSettings {
  id?: string;
  agencyName?: string;
  baseCurrency?: string;
  timezone?: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpSenderName?: string;
  smtpSenderEmail?: string;
  transactionalEmailKey?: string;
  slackWebhookUrl?: string;
  domainRegistrarSecret?: string;
}

export const settingsApi = {
  getGeneralSettings: () => api.get<SystemSettings>('/settings/general'),
  updateGeneralSettings: (data: SystemSettings) => api.put<SystemSettings>('/settings/general', data),
  testSmtpConnection: (data?: Partial<SystemSettings>) => api.post<{ success: boolean; message: string }>('/settings/general/test-smtp', data || {}),
};
