import cron from 'node-cron';
import axios from 'axios';
import { getModels } from '../../../config/models';
import { logger } from '../../application/utils/logger';
import { config } from '../../../config';

export const startExpiryReminderCron = () => {
  // Run daily at midnight (0 0 * * *)
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running daily document expiry check...');
    try {
      const { DocumentRecord } = getModels();
      
      // Calculate date 30 days from now
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      // Find documents expiring exactly on that day
      const startOfDay = new Date(thirtyDaysFromNow.setHours(0, 0, 0, 0));
      const endOfDay = new Date(thirtyDaysFromNow.setHours(23, 59, 59, 999));

      const expiringDocs = await DocumentRecord.find({
        expiryDate: { $gte: startOfDay, $lte: endOfDay },
        deletedAt: { $exists: false }
      }).lean();

      if (expiringDocs.length > 0) {
        await axios.post(`${config.coreServiceUrl}/api/v1/notifications/internal/admin-alert`, {
          title: 'Document Expiry Alert',
          body: `${expiringDocs.length} document(s) are expiring in 30 days. Action may be required.`,
          type: 'expiry_reminder'
        });
      }
    } catch (err) {
      logger.error(`Error in expiry cron job: ${err}`);
    }
  });

  logger.info('Expiry reminder cron initialized');
};
