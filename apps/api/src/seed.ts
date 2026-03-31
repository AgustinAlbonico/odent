/**
 * Seed script — creates a demo tenant and users for each role.
 *
 * Usage: pnpm db:seed
 *
 * Run from the monorepo root (or apps/api) after the schema has been pushed:
 *   pnpm --filter @sistema-odontologico/api db:push
 *   pnpm --filter @sistema-odontologico/api db:seed
 */

import bcrypt from 'bcryptjs';
import postgres from 'postgres';

// ─── Config ──────────────────────────────────────────────

const DATABASE_URL: string = process.env.DATABASE_URL ?? '';
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Copy .env.example to .env and configure it.');
  process.exit(1);
}

interface SeedTenant {
  name: string;
  schema: string;
  users: SeedUser[];
}

interface SeedUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'profesional' | 'asistente' | 'profesional_supervisor';
}

const SEED_TENANTS: SeedTenant[] = [
  {
    name: 'Clínica Demo',
    schema: 'public',
    users: [
      {
        email: 'albofacultad@gmail.com',
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'Albo',
        role: 'admin',
      },
      {
        email: 'admin@demo.com',
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'Demo',
        role: 'admin',
      },
      {
        email: 'profesional@demo.com',
        password: 'Profesional123!',
        firstName: 'Dra. María',
        lastName: 'González',
        role: 'profesional',
      },
      {
        email: 'asistente@demo.com',
        password: 'Asistente123!',
        firstName: 'Carlos',
        lastName: 'López',
        role: 'asistente',
      },
      {
        email: 'supervisor@demo.com',
        password: 'Supervisor123!',
        firstName: 'Dr. Roberto',
        lastName: 'Martínez',
        role: 'profesional_supervisor',
      },
    ],
  },
  {
    name: 'Clínica Sur',
    schema: 'tenant_clinica_sur',
    users: [
      {
        email: 'admin@clinicasur.com',
        password: 'AdminSur123!',
        firstName: 'Admin',
        lastName: 'Sur',
        role: 'admin',
      },
      {
        email: 'profesional@clinicasur.com',
        password: 'ProfesionalSur123!',
        firstName: 'Dra. Lucía',
        lastName: 'Fernández',
        role: 'profesional',
      },
      {
        email: 'asistente@clinicasur.com',
        password: 'AsistenteSur123!',
        firstName: 'Martín',
        lastName: 'Rodríguez',
        role: 'asistente',
      },
      {
        email: 'supervisor@clinicasur.com',
        password: 'SupervisorSur123!',
        firstName: 'Dr. Pablo',
        lastName: 'Herrera',
        role: 'profesional_supervisor',
      },
    ],
  },
];

// ─── Main ────────────────────────────────────────────────

async function seed() {
  const sql = postgres(DATABASE_URL);

  try {
    console.log('🌱 Starting seed...\n');

    const allTenantIds: string[] = [];

    for (const tenant of SEED_TENANTS) {
      console.log(`🏢 Tenant: ${tenant.name} (schema: ${tenant.schema})\n`);

      const existingTenants = await sql`
        SELECT id FROM tenants WHERE schema = ${tenant.schema}
      `;

      let tenantId: string;

      if (existingTenants.length > 0) {
        tenantId = String(existingTenants[0]?.id ?? '');
        console.log(`  ✅ Tenant already exists (id: ${tenantId})`);
      } else {
        tenantId = crypto.randomUUID();
        await sql`
          INSERT INTO tenants (id, name, schema, plan)
          VALUES (${tenantId}, ${tenant.name}, ${tenant.schema}, 'free')
        `;
        console.log(`  ✅ Tenant created (id: ${tenantId})`);
      }

      allTenantIds.push(tenantId);

      console.log('\n  👥 Seeding users...\n');

      for (const user of tenant.users) {
        const existing = await sql`
          SELECT id FROM users WHERE email = ${user.email}
        `;

        if (existing.length > 0) {
          console.log(`    ⏭️  ${user.email} — already exists, skipping`);
          continue;
        }

        const passwordHash = await bcrypt.hash(user.password, 10);

        await sql`
          INSERT INTO users (email, password_hash, first_name, last_name, role, state)
          VALUES (${user.email}, ${passwordHash}, ${user.firstName}, ${user.lastName}, ${user.role}, 'active')
        `;

        console.log(`    ✅ ${user.email} (${user.role}) — password: ${user.password}`);
      }

      console.log('');
    }

    // ── Summary ──────────────────────────────────────────

    console.log('─'.repeat(50));
    console.log('🎉 Seed complete!\n');

    for (let i = 0; i < SEED_TENANTS.length; i++) {
      const t = SEED_TENANTS[i]!;
      console.log(`🏢 ${t.name} (schema: ${t.schema})`);
      console.log(`   Tenant ID: ${allTenantIds[i]}`);
      console.log(`   NEXT_PUBLIC_TENANT_ID=${allTenantIds[i]}`);
      console.log('');
    }

    console.log('─'.repeat(50));
    console.log('\n📋 Test credentials:\n');

    for (const tenant of SEED_TENANTS) {
      console.log(`  --- ${tenant.name} ---`);
      for (const user of tenant.users) {
        console.log(`    ${user.role.padEnd(25)} ${user.email.padEnd(30)} ${user.password}`);
      }
      console.log('');
    }

    // ── Auto-update .env with first tenant ───────────────

    if (allTenantIds[0]) {
      await updateEnvFile(allTenantIds[0]);
    }

  } finally {
    await sql.end();
  }
}

/**
 * Append or update NEXT_PUBLIC_TENANT_ID in the root .env file.
 */
async function updateEnvFile(tenantId: string) {
  const fs = await import('node:fs');
  const path = await import('node:path');

  const envPath = path.resolve(import.meta.dirname, '../../../.env');

  if (!fs.existsSync(envPath)) {
    console.log('⚠️  .env file not found — set NEXT_PUBLIC_TENANT_ID manually.');
    return;
  }

  let content = fs.readFileSync(envPath, 'utf-8');

  const key = 'NEXT_PUBLIC_TENANT_ID';
  const line = `${key}=${tenantId}`;

  if (content.includes(`${key}=`)) {
    content = content.replace(/NEXT_PUBLIC_TENANT_ID=.*/, line);
  } else {
    content = content.trimEnd() + '\n' + line + '\n';
  }

  fs.writeFileSync(envPath, content, 'utf-8');
  console.log('✅ .env updated with NEXT_PUBLIC_TENANT_ID');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
