import { Application } from '../models/Application';
import { triggerNotification } from './notification';
import { logger } from './logger';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export async function checkAndSendDraftReminders() {
  try {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - SIX_HOURS_MS);

    // Find drafts that haven't been updated for 6 hours, or whose last reminder was sent 6 hours ago
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
      
      // Trigger notification (which handles local DB save & mock push dispatch)
      await triggerNotification(draft.citizenId, title, body, 'application_update');

      // Update reminder timestamp
      draft.lastDraftReminderSentAt = now;
      await draft.save();

      logger.info(`Reminder notification sent for draft: ${draft.applicationRefNo}`);
    }
  } catch (err: any) {
    logger.error('Error running draft reminders check', { error: err.message });
  }
}

// Start the periodic reminder checker
export function startDraftReminderCron() {
  logger.info('Draft reminder checking service started.');
  
  // Run checks every 10 minutes (600,000 ms)
  setInterval(async () => {
    logger.info('Running draft reminder check...');
    await checkAndSendDraftReminders();
  }, 10 * 60 * 1000);
}
