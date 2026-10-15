const fs = require('fs');
const path = '/home/aayush/Desktop/cybersave2/cybersave-backend/services/ops-service/src/modules/application/routes/index.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Add escalateApplication to imports
content = content.replace(
  "  updateApplicationStatus,",
  "  updateApplicationStatus,\n  escalateApplication,"
);

// 2. Add route
content = content.replace(
  "  updateApplicationStatus\n);",
  "  updateApplicationStatus\n);\n\nrouter.patch(\n  '/applications/:id/escalate',\n  authenticate,\n  authorize(['super_admin', 'admin', 'operator']),\n  escalateApplication\n);"
);

fs.writeFileSync(path, content, 'utf8');
console.log('application routes updated');
