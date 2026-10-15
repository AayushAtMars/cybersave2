const fs = require('fs');
const path = '/home/aayush/Desktop/cybersave2/cybersave-backend/services/ops-service/src/modules/application/controllers/application.controller.ts';
let content = fs.readFileSync(path, 'utf8');

const regexToReplace = /if \(dateFilter === 'today'\) \{/;

const customDateLogic = `
      if (dateFilter.match(/^\\d{4}-\\d{2}-\\d{2}$/)) {
        // Handle specific YYYY-MM-DD date
        const targetDate = new Date(dateFilter);
        // Start of day in IST
        const startOfDay = new Date(targetDate.getTime() - (5.5 * 60 * 60 * 1000));
        // End of day in IST
        const endOfDay = new Date(targetDate.getTime() + (24 * 60 * 60 * 1000) - 1 - (5.5 * 60 * 60 * 1000));
        filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
      } else if (dateFilter === 'today') {
`;

content = content.replace(regexToReplace, customDateLogic.trim());

fs.writeFileSync(path, content, 'utf8');
console.log('custom date filter added');
