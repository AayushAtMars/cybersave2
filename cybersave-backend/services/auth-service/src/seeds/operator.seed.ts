/**
 * Operator Seed Script
 * Registers a default operator account for testing Phase 4 dashboards.
 *
 * Usage: npx ts-node --transpile-only src/seeds/operator.seed.ts
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { Operator } from '../models/Operator';
import { hashPassword } from '../utils/crypto';
import { UserRole } from '@cybersave/shared';

async function main() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log('Connected to MongoDB');

  const email = 'operator1@cybersave.in';
  const existing = await Operator.findOne({ email });

  if (existing) {
    console.log(`Operator ${email} already exists.`);
  } else {
    const passwordHash = await hashPassword('Password123');
    await Operator.create({
      name: 'Rahul Operator',
      email,
      passwordHash,
      employeeId: 'EMP-2026-001',
      department: 'Birth & Identity Verification',
      role: UserRole.OPERATOR,
      permissions: ['verify_documents', 'approve_applications', 'reject_applications'],
      status: 'active',
    });
    console.log(`✓ Seeded Operator: ${email} (Password: Password123)`);
  }

  // Also seed a Super Admin
  const adminEmail = 'admin@cybersave.in';
  const existingAdmin = await Operator.findOne({ email: adminEmail });
  if (existingAdmin) {
    console.log(`Admin ${adminEmail} already exists.`);
  } else {
    const passwordHash = await hashPassword('AdminPassword123');
    await Operator.create({
      name: 'Super Admin',
      email: adminEmail,
      passwordHash,
      employeeId: 'EMP-2026-999',
      department: 'IT Security Administration',
      role: UserRole.SUPER_ADMIN,
      permissions: [
        'verify_documents',
        'approve_applications',
        'reject_applications',
        'escalate_to_admin',
        'access_citizen_pii',
        'view_transactions',
        'manage_tickets',
      ],
      status: 'active',
    });
    console.log(`✓ Seeded Admin: ${adminEmail} (Password: AdminPassword123)`);
  }

  await mongoose.disconnect();
  console.log('Database disconnected.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
