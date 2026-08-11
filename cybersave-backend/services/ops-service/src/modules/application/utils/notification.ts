import axios from 'axios';
import { config } from '../../../config';
import { logger } from './logger';

export async function triggerNotification(
  citizenId: string,
  title: string,
  body: string,
  type: string = 'system'
): Promise<void> {
  try {
    // Send HTTP call to the core-service notification endpoint
    await axios.post(`${config.coreServiceUrl}/api/v1/notifications/send`, {
      citizenId,
      title,
      body,
      type,
    });
  } catch (err: any) {
    logger.error('Failed to trigger notification via core-service', { error: err.message });
  }
}
