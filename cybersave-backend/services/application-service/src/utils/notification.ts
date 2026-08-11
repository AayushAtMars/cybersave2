import axios from 'axios';
import { logger } from './logger';

const NOTIFICATION_SVC_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';

export const triggerNotification = async (
  citizenId: string,
  title: string,
  body: string,
  type: string
) => {
  try {
    await axios.post(`${NOTIFICATION_SVC_URL}/api/v1/notifications/send`, {
      citizenId,
      title,
      body,
      type,
    });
    logger.info('Notification triggered successfully', { citizenId, title });
  } catch (err: any) {
    logger.error('Failed to trigger notification', { citizenId, error: err.message });
  }
};
