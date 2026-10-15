const fs = require('fs');
const path = '/home/aayush/Desktop/cybersave2/cybersave-backend/services/ops-service/src/modules/application/controllers/application.controller.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /const priority = req\.query\.priority as string \| undefined;/;
content = content.replace(regex, `const priority = req.query.priority as string | undefined;\n    const dateFilter = req.query.date as string | undefined;`);

const dateLogic = `
    if (dateFilter && dateFilter !== 'all') {
      if (dateFilter === 'today') {
        const { startOfDay, endOfDay } = getISTDayBounds(0);
        filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
      } else if (dateFilter === '7days') {
        const { startOfDay } = getISTDayBounds(-7);
        filter.createdAt = { $gte: startOfDay };
      } else if (dateFilter === '30days') {
        const { startOfDay } = getISTDayBounds(-30);
        filter.createdAt = { $gte: startOfDay };
      }
    }
`;

// Insert the dateLogic before `const [itemsRaw, total] = await Promise.all([`
const filterRegex2 = /const \[itemsRaw, total\] = await Promise\.all\(\[/;
content = content.replace(filterRegex2, (match) => {
  return dateLogic + "\n    " + match;
});

fs.writeFileSync(path, content, 'utf8');
console.log('date filter added');
