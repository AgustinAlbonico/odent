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
  patients: SeedPatient[];
}

interface SeedUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'superadmin' | 'profesional' | 'recepcionista';
}

interface SeedPatient {
  firstName: string;
  lastName: string;
  dni: string;
  sex: 'male' | 'female';
  phone: string;
  email: string;
  birthDate: string;
  address: string;
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
        role: 'superadmin',
      },
      {
        email: 'admin@demo.com',
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'Demo',
        role: 'superadmin',
      },
      {
        email: 'profesional@demo.com',
        password: 'Profesional123!',
        firstName: 'Dra. María',
        lastName: 'González',
        role: 'profesional',
      },
      {
        email: 'recepcionista@demo.com',
        password: 'Recepcionista123!',
        firstName: 'Carla',
        lastName: 'López',
        role: 'recepcionista',
      },
    ],
    patients: [
      {
        firstName: 'Juan',
        lastName: 'Pérez',
        dni: '30123456',
        sex: 'male',
        phone: '11-5555-0101',
        email: 'juan.perez@email.com',
        birthDate: '1988-05-14',
        address: 'Av. Corrientes 1234, CABA',
      },
      {
        firstName: 'Ana',
        lastName: 'Martínez',
        dni: '32456789',
        sex: 'female',
        phone: '11-5555-0202',
        email: 'ana.martinez@email.com',
        birthDate: '1992-11-22',
        address: 'Calle Lavalle 567, CABA',
      },
      {
        firstName: 'Lucas',
        lastName: 'Sánchez',
        dni: '35890123',
        sex: 'male',
        phone: '11-5555-0303',
        email: 'lucas.sanchez@email.com',
        birthDate: '1995-03-08',
        address: 'Av. Santa Fe 890, CABA',
      },
      {
        firstName: 'Sofía',
        lastName: 'Torres',
        dni: '38234567',
        sex: 'female',
        phone: '11-5555-0404',
        email: 'sofia.torres@email.com',
        birthDate: '1999-07-30',
        address: 'Av. Cabildo 456, CABA',
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
        role: 'superadmin',
      },
      {
        email: 'profesional@clinicasur.com',
        password: 'ProfesionalSur123!',
        firstName: 'Dra. Lucía',
        lastName: 'Fernández',
        role: 'profesional',
      },
      {
        email: 'recepcionista@clinicasur.com',
        password: 'RecepcionistaSur123!',
        firstName: 'Marta',
        lastName: 'Rodríguez',
        role: 'recepcionista',
      },
    ],
    patients: [
      {
        firstName: 'Diego',
        lastName: 'Ramírez',
        dni: '29345678',
        sex: 'male',
        phone: '11-6666-0101',
        email: 'diego.ramirez@email.com',
        birthDate: '1985-09-12',
        address: 'Av. Rivadavia 7890, CABA',
      },
      {
        firstName: 'Valentina',
        lastName: 'Gómez',
        dni: '34678901',
        sex: 'female',
        phone: '11-6666-0202',
        email: 'valentina.gomez@email.com',
        birthDate: '1993-01-25',
        address: 'Calle Florida 234, CABA',
      },
      {
        firstName: 'Tomás',
        lastName: 'Díaz',
        dni: '37012345',
        sex: 'male',
        phone: '11-6666-0303',
        email: 'tomas.diaz@email.com',
        birthDate: '1997-06-18',
        address: 'Av. Belgrano 567, CABA',
      },
      {
        firstName: 'Camila',
        lastName: 'Herrera',
        dni: '38945612',
        sex: 'female',
        phone: '11-6666-0404',
        email: 'camila.herrera@email.com',
        birthDate: '1998-10-04',
        address: 'Av. San Juan 1450, CABA',
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

        const passwordHash = await bcrypt.hash(user.password, 10);

        if (existing.length > 0) {
          // Update tenant_id for existing users that don't have it yet
          await sql`
            UPDATE users SET tenant_id = ${tenantId} WHERE email = ${user.email} AND tenant_id IS NULL
          `;
          console.log(`    ⏭️  ${user.email} — already exists, tenant_id updated`);
          continue;
        }

        await sql`
          INSERT INTO users (email, password_hash, first_name, last_name, role, state, tenant_id)
          VALUES (${user.email}, ${passwordHash}, ${user.firstName}, ${user.lastName}, ${user.role}, 'active', ${tenantId})
        `;

        console.log(`    ✅ ${user.email} (${user.role}) — password: ${user.password}`);
      }

      // ── Seed patients for this tenant ──────────────────

      console.log('\n  🏥 Seeding patients...\n');

      for (const patient of tenant.patients) {
        const existing = await sql`
          SELECT id, tenant_id
          FROM patients
          WHERE dni = ${patient.dni}
          ORDER BY CASE WHEN tenant_id = ${tenantId} THEN 0 ELSE 1 END, created_at ASC
        `;

        if (existing.length > 0) {
          const existingId = String(existing[0]?.id ?? '');
          const previousTenantId = String(existing[0]?.tenant_id ?? '');
          const tenantChanged = previousTenantId !== tenantId;

          await sql`
            UPDATE patients
            SET
              tenant_id = ${tenantId},
              first_name = ${patient.firstName},
              last_name = ${patient.lastName},
              sex = ${patient.sex},
              phone = ${patient.phone},
              email = ${patient.email},
              birth_date = ${patient.birthDate},
              address = ${patient.address},
              state = 'active',
              updated_at = NOW()
            WHERE id = ${existingId}
          `;

          console.log(
            `    ⏭️  ${patient.firstName} ${patient.lastName} (DNI: ${patient.dni}) — updated${tenantChanged ? ', tenant reassigned' : ''}`,
          );
          continue;
        }

        await sql`
          INSERT INTO patients (first_name, last_name, dni, sex, phone, email, birth_date, address, state, tenant_id)
          VALUES (
            ${patient.firstName},
            ${patient.lastName},
            ${patient.dni},
            ${patient.sex},
            ${patient.phone},
            ${patient.email},
            ${patient.birthDate},
            ${patient.address},
            'active',
            ${tenantId}
          )
        `;

        console.log(`    ✅ ${patient.firstName} ${patient.lastName} (DNI: ${patient.dni})`);
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
