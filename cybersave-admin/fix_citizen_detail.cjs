const fs = require('fs');
const path = '/home/aayush/Desktop/cybersave2/cybersave-admin/src/pages/CitizenDetailPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add noteText state and note saving logic
content = content.replace(
  "  const [sendingNotif, setSendingNotif] = useState(false);",
  "  const [sendingNotif, setSendingNotif] = useState(false);\n  const [noteText, setNoteText] = useState('');\n  const [savingNote, setSavingNote] = useState(false);"
);

content = content.replace(
  "  const handleSendNotification = async (e: React.FormEvent) => {",
  `
  const handleSaveNote = async () => {
    if (!noteText.trim() || !citizen) return;
    setSavingNote(true);
    try {
      const res = await adminClient.post(\`/auth/admin/citizens/\${citizenId}/notes\`, { note: noteText });
      if (res.data?.success) {
        setCitizen(prev => prev ? { ...prev, operatorNotes: res.data.data.operatorNotes } : prev);
        setNoteText('');
        showToast('Note saved successfully');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {`
);

// 2. Update Notes Tab UI
const oldNotesTab = /\{\/\* ── NOTES TAB ───────────────────────────────────────────────────── \*\/\}\s*\{activeTab === 'notes' && \(\s*<div>\s*<h3 style=\{\{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0' \}\}>Operator Notes<\/h3>\s*<textarea\s*placeholder="Add a note about this citizen\.\.\."\s*style=\{\{\s*width: '100%', height: '120px', padding: '12px', boxSizing: 'border-box' as const,\s*border: '1\.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13\.5px', color: '#0F172A',\s*resize: 'vertical' as const, outline: 'none',\s*\}\}\s*\/>\s*<div style=\{\{ marginTop: '12px', textAlign: 'right' \}\}>\s*<button\s*onClick=\{\(\) => showToast\('Note saved'\)\}\s*style=\{\{ padding: '9px 20px', backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' \}\}\s*>\s*Save Note\s*<\/button>\s*<\/div>\s*<\/div>\s*\)/;

const newNotesTab = `{/* ── NOTES TAB ───────────────────────────────────────────────────── */}
          {activeTab === 'notes' && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0' }}>Operator Notes</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {(!citizen.operatorNotes || citizen.operatorNotes.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8', fontSize: '13px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px dashed #E2E8F0' }}>
                    No notes have been added for this citizen yet.
                  </div>
                ) : (
                  citizen.operatorNotes.map((note: any, idx: number) => (
                    <div key={idx} style={{ backgroundColor: '#FFFBEB', border: '1.5px solid #FEF3C7', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px' }}>📝</span>
                          <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#D97706' }}>Note by {note.authorName}</span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>{new Date(note.timestamp).toLocaleString('en-GB')}</span>
                      </div>
                      <p style={{ fontSize: '13.5px', color: '#451A03', fontWeight: 550, margin: 0, lineHeight: 1.4 }}>{note.note}</p>
                    </div>
                  ))
                )}
              </div>

              <textarea
                placeholder="Add a note about this citizen..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                style={{
                  width: '100%', height: '120px', padding: '12px', boxSizing: 'border-box' as const,
                  border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13.5px', color: '#0F172A',
                  resize: 'vertical' as const, outline: 'none',
                }}
              />
              <div style={{ marginTop: '12px', textAlign: 'right' }}>
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  style={{ padding: '9px 20px', backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: savingNote ? 'not-allowed' : 'pointer', opacity: savingNote ? 0.7 : 1 }}
                >
                  {savingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          )}`;

content = content.replace(oldNotesTab, newNotesTab);

fs.writeFileSync(path, content, 'utf8');
console.log('CitizenDetailPage updated');
