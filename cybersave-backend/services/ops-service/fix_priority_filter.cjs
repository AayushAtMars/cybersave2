const fs = require('fs');
const path = '/home/aayush/Desktop/cybersave2/cybersave-backend/services/ops-service/src/modules/application/controllers/application.controller.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /const citizenId = req\.query\.citizenId as string \| undefined;\s+const operatorId = req\.query\.operatorId as string \| undefined;/;
content = content.replace(regex, `const citizenId = req.query.citizenId as string | undefined;\n    const operatorId = req.query.operatorId as string | undefined;\n    const priority = req.query.priority as string | undefined;`);

const filterRegex = /if \(category && category !== 'All'\) \{[\s\S]*?\}\s*\}/;

const priorityLogic = `
    if (priority && priority !== 'all') {
      if (priority === 'high') {
        filter.$or = [
          ...(filter.$or || []),
          { priority: { $in: ['high', 'critical'] } },
          { serviceName: { $regex: 'pan|mobile', $options: 'i' } },
          { status: 'docs_pending' }
        ];
      } else if (priority === 'medium') {
        filter.$or = [
          ...(filter.$or || []),
          { priority: 'medium' },
          { serviceName: { $regex: 'address', $options: 'i' } },
          { status: 'under_review' }
        ];
      } else if (priority === 'low') {
        filter.$and = [
          ...(filter.$and || []),
          { priority: { $in: ['low', null, undefined] } },
          { serviceName: { $not: { $regex: 'pan|mobile|address', $options: 'i' } } },
          { status: { $nin: ['docs_pending', 'under_review'] } }
        ];
      }
    }
`;

content = content.replace(filterRegex, (match) => {
  return match + "\n" + priorityLogic;
});

fs.writeFileSync(path, content, 'utf8');
console.log('priority filter added');
