import { getModels } from '../../../config/models';
import { triggerNotification } from './notification';
import { logger } from './logger';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export async function checkAndSendDraftReminders() {
  try {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - SIX_HOURS_MS);

    const Application = getModels().Application;

    const drafts = await Application.find({
      status: 'draft',
      $or: [
        { lastDraftReminderSentAt: { $exists: false }, updatedAt: { $lte: cutoffTime } },
        { lastDraftReminderSentAt: { $lte: cutoffTime } },
      ],
    });

    if (drafts.length === 0) {
      return;
    }

    logger.info(`Found ${drafts.length} draft applications matching reminder criteria.`);

    for (const draft of drafts) {
      const title = 'Complete Your Application';
      const body = `Your draft for "${draft.serviceName}" is waiting. Click here to complete your application.`;
      
      await triggerNotification(draft.citizenId, title, body, 'application_update');

      draft.lastDraftReminderSentAt = now;
      await draft.save();

      logger.info(`Reminder notification sent for draft: ${draft.applicationRefNo}`);
    }
  } catch (err: any) {
    logger.error('Error running draft reminders check', { error: err.message });
  }
}

export function startDraftReminderCron() {
  logger.info('Draft reminder checking service started.');
  
  setInterval(async () => {
    logger.info('Running draft reminder check...');
    await checkAndSendDraftReminders();
  }, 10 * 60 * 1000);
}
