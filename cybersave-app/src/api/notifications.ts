import { apiClient as client } from './client';

export interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  type: 'application_update' | 'payment' | 'support' | 'system';
  read: boolean;
  createdAt: string;
}

export const getNotifications = async () => {
  const { data } = await client.get<{ success: boolean; data: { items: NotificationItem[] } }>('/notifications');
  return data.data.items;
};

export const markNotificationsRead = async (ids?: string[]) => {
  const { data } = await client.post<{ success: boolean }>('/notifications/read', { ids });
  return data.success;
};
