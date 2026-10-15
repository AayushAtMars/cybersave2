const fs = require('fs');
const path = '/home/aayush/Desktop/cybersave2/cybersave-backend/services/ops-service/src/modules/application/controllers/application.controller.ts';
let content = fs.readFileSync(path, 'utf8');

const escalateLogic = `
// ── PATCH /applications/:id/escalate — bump priority ────────────────────
export const escalateApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { Application } = getModels();

    const app = await Application.findById(id);
    if (!app) {
      res.status(404).json({ success: false, error: 'Application not found' });
      return;
    }

    const priorityLevels = ['low', 'medium', 'high', 'critical'];
    let currentIdx = priorityLevels.indexOf(app.priority || 'low');
    if (currentIdx < priorityLevels.length - 1) {
      currentIdx++;
    }
    const newPriority = priorityLevels[currentIdx];

    app.priority = newPriority;
    
    // Also add to timeline
    app.addTimelineEvent(
      'Application Escalated',
      req.user?.id || 'system',
      req.user?.role || 'system',
      \`Priority changed to \${newPriority}\`
    );

    await app.save();

    res.json({ success: true, data: app });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
`;

content += '\n' + escalateLogic;
fs.writeFileSync(path, content, 'utf8');
console.log('application.controller.ts updated');
