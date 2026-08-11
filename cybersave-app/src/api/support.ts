import { apiClient as client } from './client';

export interface Message {
  senderId: string;
  senderRole: 'citizen' | 'operator' | 'system';
  message: string;
  timestamp: string;
}

export interface Ticket {
  _id: string;
  subject: string;
  description: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  attachmentUrl?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export const getTickets = async () => {
  const { data } = await client.get<{ success: boolean; data: { items: Ticket[] } }>('/support/tickets');
  return data.data.items;
};

export const getTicket = async (id: string) => {
  const { data } = await client.get<{ success: boolean; data: { ticket: Ticket } }>(`/support/tickets/${id}`);
  return data.data.ticket;
};

export const createTicket = async (
  subject: string,
  description: string,
  category?: string,
  priority?: 'low' | 'medium' | 'high',
  attachmentUrl?: string
) => {
  const { data } = await client.post<{ success: boolean; data: { ticket: Ticket } }>('/support/tickets', {
    subject,
    description,
    category,
    priority,
    attachmentUrl,
  });
  return data.data.ticket;
};

export const replyToTicket = async (id: string, message: string) => {
  const { data } = await client.post<{ success: boolean; data: { ticket: Ticket } }>(`/support/tickets/${id}/reply`, {
    message,
  });
  return data.data.ticket;
};
