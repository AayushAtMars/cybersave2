const fs = require('fs');
const path = '/home/aayush/Desktop/cybersave2/cybersave-backend/services/core-service/src/modules/auth/controllers/auth.controller.ts';
let content = fs.readFileSync(path, 'utf8');

const noteLogic = `
export const addOperatorNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const User = getUser();
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (!user.operatorNotes) {
      user.operatorNotes = [];
    }

    user.operatorNotes.push({
      authorName: req.headers['x-user-name'] as string || 'Operator',
      authorRole: req.user?.role || 'operator',
      note,
      timestamp: new Date(),
    });

    await user.save();
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
`;

content += '\n' + noteLogic;

fs.writeFileSync(path, content, 'utf8');
console.log('auth.controller.ts updated');
