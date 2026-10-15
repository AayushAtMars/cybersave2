const fs = require('fs');
const path = '/home/aayush/Desktop/cybersave2/cybersave-admin/src/pages/TicketsPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const handler = `
  const handleViewAttachment = async (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    try {
      const match = url.match(/\\/sign\\/cybersave-documents\\/(.*?)\\?token=/);
      if (match && match[1]) {
        const storageKey = decodeURIComponent(match[1]);
        const res = await adminClient.post('/ops/documents/refresh-url', { storageKey });
        window.open(res.data.data.url, '_blank');
      } else {
        window.open(url, '_blank');
      }
    } catch (err) {
      alert("Failed to open attachment.");
    }
  };

  const handleUpdatePriority = `;

content = content.replace('  const handleUpdatePriority = ', handler);

const newLink = `<a href="#" onClick={(e) => handleViewAttachment(e, selectedTicket.attachmentUrl!)} style={{ fontSize: '13px', color: '#2563EB', fontWeight: 750, textDecoration: 'underline' }}>View Image/PDF</a>`;
content = content.replace(/<a href=\{selectedTicket\.attachmentUrl\} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#2563EB', fontWeight: 750, textDecoration: 'underline' }}>View Image\/PDF<\/a>/g, newLink);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
