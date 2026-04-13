import { z } from 'zod';

// ─── Create User ──────────────────────────────────────
export const createUserSchema = z.object({
  email: z.email('Email inválido'),
  firstName: z.string().min(1, 'Nombre requerido').max(100),
  lastName: z.string().min(1, 'Apellido requerido').max(100),
  role: z.enum(['superadmin', 'profesional', 'recepcionista'], {
    message: 'Rol inválido',
  }),
  state: z.enum(['active', 'inactive', 'pending_password_change']).default('active'),
  mustChangePassword: z.boolean().default(true),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// ─── Update User ──────────────────────────────────────
export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.enum(['superadmin', 'profesional', 'recepcionista']).optional(),
  state: z.enum(['active', 'inactive', 'locked', 'pending_password_change']).optional(),
  mustChangePassword: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ─── List Users Query ─────────────────────────────────
export const listUsersQuerySchema = z.object({
  role: z.enum(['superadmin', 'profesional', 'recepcionista']).optional(),
  state: z.enum(['active', 'inactive', 'locked', 'pending_password_change']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListUsersQueryInput = z.infer<typeof listUsersQuerySchema>;

// ─── Force Password Change ────────────────────────────
export const forcePasswordSchema = z.object({
  mustChangePassword: z.literal(true),
});

export type ForcePasswordInput = z.infer<typeof forcePasswordSchema>;

// ─── Update Permissions ───────────────────────────────
export const updatePermissionsSchema = z.object({
  permissions: z.array(
    z.object({
      module: z.string(),
      action: z.string(),
      scope: z.string(),
    }),
  ).min(0),
});

export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>;
