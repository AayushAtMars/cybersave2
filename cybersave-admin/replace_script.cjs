const fs = require('fs');
const path = '/home/aayush/Desktop/cybersave2/cybersave-admin/src/pages/TicketsPage.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/citizenId: string;/g, "citizenId: string;\n  citizenName?: string;");

content = content.replace(/const citizenInitials = 'JS';/g, "const reporterName = selectedTicket.citizenName || 'User ' + selectedTicket.citizenId.slice(-4);\n    const citizenInitials = reporterName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);");

content = content.replace(/Notify Reporter \(John Smith\)/g, "Notify Reporter ({reporterName})");
content = content.replace(/>John Smith</g, ">{reporterName}<");
content = content.replace(/Hello John Smith,/g, "Hello {reporterName},");
content = content.replace(/'John Smith'/g, "reporterName");
content = content.replace(/response to John Smith here/g, "response to ${reporterName} here");

fs.writeFileSync(path, content, 'utf8');
console.log('Replacements completed.');
