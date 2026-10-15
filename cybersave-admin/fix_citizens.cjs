const fs = require('fs');
const path = '/home/aayush/Desktop/cybersave2/cybersave-admin/src/pages/CitizensPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add dateFilter state
content = content.replace(
  "  const [selectedService, setSelectedService] = useState('All Services');",
  "  const [selectedService, setSelectedService] = useState('All Services');\n  const [dateFilter, setDateFilter] = useState('Last 30 Days');"
);

// 2. Add dateFilter to useEffects
content = content.replace(
  "  useEffect(() => {\n    setPage(1);\n  }, [search, statusTab, selectedDistrict]);",
  "  useEffect(() => {\n    setPage(1);\n  }, [search, statusTab, selectedDistrict, dateFilter, selectedService]);"
);

content = content.replace(
  "  useEffect(() => { fetchCitizens(); }, [search, page, statusTab, selectedDistrict]);",
  "  useEffect(() => { fetchCitizens(); }, [search, page, statusTab, selectedDistrict, dateFilter, selectedService]);"
);

// 3. Add to fetchCitizens params
content = content.replace(
  "          district: selectedDistrict !== 'All' ? selectedDistrict : undefined,",
  "          district: selectedDistrict !== 'All' ? selectedDistrict : undefined,\n          dateFilter: dateFilter !== 'All Time' ? dateFilter : undefined,\n          service: selectedService !== 'All Services' ? selectedService : undefined,"
);

// 4. Change 'Last 30 Days' to a select
const dateSelect = `          <div style={{ position: 'relative' }}>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ appearance: 'none', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', padding: '9px 32px 9px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#334155', outline: 'none', cursor: 'pointer' }}
            >
              {['All Time', 'Last 7 Days', 'Last 30 Days', 'Last 90 Days'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: '12px', top: '14px', pointerEvents: 'none', color: '#64748B' }}>
              <Icons.ChevronDown />
            </span>
          </div>`;

content = content.replace(
  /<div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #E2E8F0', padding: '9px 12px', borderRadius: '8px', backgroundColor: '#FFFFFF', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>[\s\S]*?<\/div>/,
  dateSelect
);

// 5. Change district dropdown to use districts array
content = content.replace(
  "{availableDistricts.map(d => (",
  "{districts.map(d => ("
);

fs.writeFileSync(path, content, 'utf8');
console.log('CitizensPage updated');
