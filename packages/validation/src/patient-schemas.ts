import { z } from 'zod';

// ─── Enums ──────────────────────────────────────────────
const patientSexEnum = z.enum(['male', 'female', 'other']);
const bloodGroupEnum = z.enum(['A', 'B', 'AB', 'O']);
const rhFactorEnum = z.enum(['positive', 'negative']);

// ─── Create Patient ───────────────────────────────────
export const createPatientSchema = z.object({
  dni: z.string().max(20, 'DNI máximo 20 caracteres').optional().or(z.literal('')),
  firstName: z.string().min(1, 'Nombre requerido').max(100),
  lastName: z.string().min(1, 'Apellido requerido').max(100),
  sex: patientSexEnum.optional().or(z.literal('')),
  email: z.email('Email inválido').optional().or(z.literal('')),
  phone: z.string().max(30, 'Teléfono máximo 30 caracteres').optional().or(z.literal('')),
  birthDate: z.string().date('Fecha inválida').optional().or(z.literal('')),
  bloodGroup: bloodGroupEnum.optional().or(z.literal('')),
  rhFactor: rhFactorEnum.optional().or(z.literal('')),
  address: z.string().max(500, 'Dirección muy larga').optional().or(z.literal('')),
  postalCode: z.string().max(10, 'Código postal máximo 10 caracteres').optional().or(z.literal('')),
  notes: z.string().max(2000, 'Notas muy largas').optional().or(z.literal('')),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

// ─── Update Patient ───────────────────────────────────
export const updatePatientSchema = z.object({
  dni: z.string().max(20).optional().or(z.literal('')),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  sex: patientSexEnum.optional().or(z.literal('')),
  email: z.email().optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  birthDate: z.string().date().optional().or(z.literal('')),
  bloodGroup: bloodGroupEnum.optional().or(z.literal('')),
  rhFactor: rhFactorEnum.optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  postalCode: z.string().max(10).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

// ─── List Patients Query ──────────────────────────────
export const listPatientsQuerySchema = z.object({
  search: z.string().optional(),
  state: z.enum(['active', 'inactive']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListPatientsQueryInput = z.infer<typeof listPatientsQuerySchema>;

// ─── Change Patient State ─────────────────────────────
export const changePatientStateSchema = z.object({
  state: z.enum(['active', 'inactive']),
});

export type ChangePatientStateInput = z.infer<typeof changePatientStateSchema>;

// ─── Create Patient Mutual ────────────────────────────
export const createPatientMutualSchema = z.object({
  mutualId: z.string().uuid('ID de mutual inválido'),
  planName: z.string().max(150).optional(),
  affiliateNumber: z.string().min(1, 'Número de afiliado requerido').max(50),
  coveragePercent: z.number().int().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
});

export type CreatePatientMutualInput = z.infer<typeof createPatientMutualSchema>;
