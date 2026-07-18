import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface SeedUser {
  email: string;
  name: string;
  role: Role;
  password: string;
}

const SEED_USERS: SeedUser[] = [
  { email: 'admin@demo.org', name: 'Demo Admin', role: Role.ADMIN, password: 'admin1234' },
  { email: 'sam@demo.org', name: 'Sam Rivera', role: Role.USER, password: 'volunteer1' },
  { email: 'jo@demo.org', name: 'Jo Chen', role: Role.USER, password: 'volunteer2' },
];

function daysFromNow(days: number, hour: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

const SEED_SHIFTS = [
  { key: 'shift-food-1', role: 'Food Bank Sorter', location: 'Downtown Pantry', startsAt: daysFromNow(2, 9), hours: 3, capacity: 4 },
  { key: 'shift-reception', role: 'Front Desk Greeter', location: 'Community Center', startsAt: daysFromNow(3, 13), hours: 4, capacity: 2 },
  { key: 'shift-garden', role: 'Garden Helper', location: 'Riverside Community Garden', startsAt: daysFromNow(5, 8), hours: 2, capacity: 6 },
  { key: 'shift-tutoring', role: 'Reading Tutor', location: 'Eastside Library', startsAt: daysFromNow(6, 16), hours: 2, capacity: 3 },
  { key: 'shift-cleanup', role: 'Park Cleanup Crew', location: 'Lakeview Park', startsAt: daysFromNow(8, 10), hours: 5, capacity: 8 },
];

async function main(): Promise<void> {
  const usersByEmail: Record<string, { id: string }> = {};
  const creds: Array<{ email: string; password: string; role: Role }> = [];

  for (const u of SEED_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash },
      create: { email: u.email, name: u.name, role: u.role, passwordHash },
    });
    usersByEmail[u.email] = user;
    creds.push({ email: u.email, password: u.password, role: u.role });
    console.log(`SEED_CRED ${u.role} ${u.email} ${u.password}`);
  }

  const shiftsByKey: Record<string, { id: string }> = {};
  for (const s of SEED_SHIFTS) {
    const existing = await prisma.shift.findFirst({
      where: { role: s.role, location: s.location },
    });
    const shift = existing
      ? await prisma.shift.update({
          where: { id: existing.id },
          data: { startsAt: s.startsAt, hours: s.hours, capacity: s.capacity },
        })
      : await prisma.shift.create({
          data: {
            role: s.role,
            location: s.location,
            startsAt: s.startsAt,
            hours: s.hours,
            capacity: s.capacity,
          },
        });
    shiftsByKey[s.key] = shift;
  }

  const sampleSignups = [
    { email: 'sam@demo.org', key: 'shift-food-1' },
    { email: 'sam@demo.org', key: 'shift-garden' },
    { email: 'jo@demo.org', key: 'shift-reception' },
  ];
  for (const sig of sampleSignups) {
    const user = usersByEmail[sig.email];
    const shift = shiftsByKey[sig.key];
    if (!user || !shift) continue;
    await prisma.signup.upsert({
      where: { userId_shiftId: { userId: user.id, shiftId: shift.id } },
      update: {},
      create: { userId: user.id, shiftId: shift.id },
    });
  }

  console.log('SEED_CREDS_JSON=' + JSON.stringify(creds));
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
