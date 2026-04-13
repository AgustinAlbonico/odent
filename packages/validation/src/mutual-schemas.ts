import { z } from 'zod';

// ─── Create Mutual ────────────────────────────────────
export const createMutualSchema = z.object({
  name: z.string().min(1, 'Nombre de mutual requerido').max(200),
  code: z
    .string()
    .min(1, 'Código requerido')
    .max(20, 'Código máximo 20 caracteres')
    .toUpperCase(),
  phone: z.string().max(50, 'Teléfono máximo 50 caracteres').optional().or(z.literal('')),
});

export type CreateMutualInput = z.infer<typeof createMutualSchema>;

// ─── Update Mutual ────────────────────────────────────
export const updateMutualSchema = createMutualSchema.partial();

export type UpdateMutualInput = z.infer<typeof updateMutualSchema>;

// ─── List Mutuals Query ───────────────────────────────
export const listMutualsQuerySchema = z.object({
  search: z.string().optional(),
  includeInactive: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListMutualsQueryInput = z.infer<typeof listMutualsQuerySchema>;

// ─── Add Professional Mutual ──────────────────────────
export const addProfessionalMutualSchema = z.object({
  mutualId: z.string().uuid('ID de mutual inválido'),
});

export type AddProfessionalMutualInput = z.infer<typeof addProfessionalMutualSchema>;

// ─── Create Patient Mutual (with mutualId) ────────────
export const createPatientMutualWithIdSchema = z.object({
  mutualId: z.string().uuid('ID de mutual inválido'),
  affiliateNumber: z
    .string()
    .min(1, 'Número de afiliado requerido')
    .max(100, 'Número de afiliado máximo 100 caracteres'),
  planName: z.string().max(200, 'Nombre de plan máximo 200 caracteres').optional().or(z.literal('')),
});

export type CreatePatientMutualWithIdInput = z.infer<typeof createPatientMutualWithIdSchema>;

// ─── Update Patient Mutual ────────────────────────────
export const updatePatientMutualSchema = z.object({
  affiliateNumber: z.string().min(1).max(100).optional(),
  planName: z.string().max(200).optional().or(z.literal('')),
  coveragePercent: z.number().int().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export type UpdatePatientMutualInput = z.infer<typeof updatePatientMutualSchema>;
