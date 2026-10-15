const fs = require('fs');
const path = '/home/aayush/Desktop/cybersave2/cybersave-admin/src/pages/TicketsPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const newFn = `
  const handleUpdatePriority = async (id: string, newPriority: string) => {
    try {
      await adminClient.patch(\`/support/operator/tickets/\${id}/priority\`, { priority: newPriority });
      alert(\`Ticket priority upgraded to \${newPriority.toUpperCase()}\`);
      fetchTickets();
    } catch (err) {
      alert('Failed to update priority');
    }
  };

  const handleUpdateStatus = async `;

content = content.replace('  const handleUpdateStatus = async ', newFn);

const escalateBtn1 = `<button style={{ width: '100%', padding: '10px', border: 'none', borderRadius: '8px', fontSize: '13.5px', fontWeight: 700, backgroundColor: selectedTicket.priority === 'critical' ? '#F1F5F9' : '#FEE2E2', color: selectedTicket.priority === 'critical' ? '#94A3B8' : '#EF4444', cursor: selectedTicket.priority === 'critical' ? 'not-allowed' : 'pointer' }} disabled={selectedTicket.priority === 'critical'} onClick={() => {
                  const current = selectedTicket.priority || 'medium';
                  const mapping: Record<string, string> = { low: 'medium', medium: 'high', high: 'critical' };
                  const next = mapping[current.toLowerCase()];
                  if (next) handleUpdatePriority(selectedTicket._id, next);
                }}>Escalate Ticket</button>`;

content = content.replace(/<button style={{ width: '100%', padding: '10px', border: 'none', borderRadius: '8px', fontSize: '13\.5px', fontWeight: 700, backgroundColor: '#FEE2E2', color: '#EF4444', cursor: 'pointer' }} onClick={\(\) => handleUpdateStatus\(selectedTicket\._id, 'escalated'\)}>Escalate Ticket<\/button>/g, escalateBtn1);

const escalateBtn2 = `<button disabled={selectedTicket.priority === 'critical'} onClick={() => {
                  const current = selectedTicket.priority || 'medium';
                  const mapping: Record<string, string> = { low: 'medium', medium: 'high', high: 'critical' };
                  const next = mapping[current.toLowerCase()];
                  if (next) handleUpdatePriority(selectedTicket._id, next);
                }} style={{ padding: '5px 10px', backgroundColor: selectedTicket.priority === 'critical' ? '#F1F5F9' : '#FEE2E2', color: selectedTicket.priority === 'critical' ? '#94A3B8' : '#EF4444', border: '1px solid ' + (selectedTicket.priority === 'critical' ? '#CBD5E1' : '#EF4444'), borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: selectedTicket.priority === 'critical' ? 'not-allowed' : 'pointer' }}>Escalate</button>`;

content = content.replace(/<button onClick={\(\) => handleUpdateStatus\(selectedTicket\._id, 'escalated'\)} style={{ padding: '5px 10px', backgroundColor: '#FEE2E2', color: '#EF4444', border: '1px solid #EF4444', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Escalate<\/button>/g, escalateBtn2);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
