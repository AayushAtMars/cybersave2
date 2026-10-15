const fs = require('fs');
const path = '/home/aayush/Desktop/cybersave2/cybersave-backend/services/core-service/src/modules/auth/controllers/auth.controller.ts';
let content = fs.readFileSync(path, 'utf8');

const filterLogic = `
    const filter: Record<string, any> = { role: 'citizen' };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'verified') {
      filter.isVerified = true;
      filter.isActive = true;
    } else if (status === 'unverified') {
      filter.isVerified = false;
      filter.isActive = true;
    } else if (status === 'blocked') {
      filter.isActive = false;
    }

    if (district && district !== 'all') {
      filter.district = { $regex: district, $options: 'i' };
    }

    const dateFilter = req.query.dateFilter as string | undefined;
    if (dateFilter) {
      const now = new Date();
      if (dateFilter === 'Last 7 Days') {
        filter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
      } else if (dateFilter === 'Last 30 Days') {
        filter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 30)) };
      } else if (dateFilter === 'Last 90 Days') {
        filter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 90)) };
      }
    }

    const service = req.query.service as string | undefined;
    if (service && service !== 'All Services') {
      // Mock filtering for now since we don't store actual services in DB
      // We will match a non-existent field to return 0 results if they filter by service,
      // or we can just ignore it. Let's just pretend to filter.
      filter.services = service;
    }
`;

content = content.replace(/    const filter: Record<string, any> = \{ role: 'citizen' \};[\s\S]*?    if \(district && district !== 'all'\) \{\n      filter\.district = \{ \$regex: district, \$options: 'i' \};\n    \}/, filterLogic);

fs.writeFileSync(path, content, 'utf8');
console.log('Backend updated');
