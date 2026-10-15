const fs = require('fs');
const path = '/home/aayush/Desktop/cybersave2/cybersave-admin/src/pages/CitizensPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Match District and Service selectors
const blockToRemove = /\s*\{\/\* District Selector \*\/\}\s*<div style=\{\{ position: 'relative' \}\}>[\s\S]*?\{\/\* Service Selector \*\/\}\s*<div style=\{\{ position: 'relative' \}\}>[\s\S]*?<\/div>\s*<\/div>/;
content = content.replace(blockToRemove, '');

fs.writeFileSync(path, content, 'utf8');
console.log('Dropdowns removed');
