'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@sistema-odontologico/ui';
import { useAuth } from '@/hooks/use-auth';
import { useAbilities } from '@/hooks/use-abilities';
import { getSessionPolicy, updateSessionPolicy, type SessionPolicy } from '@/lib/auth/api';
import { Shield, Loader2, Save, RotateCcw } from 'lucide-react';
import { Action, Module } from '@sistema-odontologico/permissions';

/* ------------------------------------------------------------------ */
/* Validation bounds                                                   */
/* ------------------------------------------------------------------ */

const BOUNDS = {
  inactivityTimeoutMinutes: { min: 5, max: 120 },
  maxSessionDurationHours: { min: 1, max: 24 },
  maxConcurrentSessions: { min: 1, max: 10 },
} as const;

type PolicyField = keyof typeof BOUNDS;

function validateField(field: PolicyField, value: number): string | null {
  const { min, max } = BOUNDS[field];
  if (Number.isNaN(value)) return 'Debe ser un n\u00famero v\u00e1lido';
  if (value < min) return `El m\u00ednimo es ${min}`;
  if (value > max) return `El m\u00e1ximo es ${max}`;
  return null;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

const DEFAULT_POLICY: SessionPolicy = {
  inactivityTimeoutMinutes: 30,
  maxSessionDurationHours: 8,
  maxConcurrentSessions: 3,
};

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { canOperate } = useAbilities();

  const canAdminPolicies = canOperate(Module.SYSTEM_CONFIG, Action.ADMIN_POLICIES);

  const [policy, setPolicy] = useState<SessionPolicy>(DEFAULT_POLICY);
  const [originalPolicy, setOriginalPolicy] = useState<SessionPolicy>(DEFAULT_POLICY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<PolicyField, string>>>({});
  const [rawFields, setRawFields] = useState<Partial<Record<PolicyField, string>>>({});

  const fetchPolicy = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSessionPolicy();
      setPolicy(result);
      setOriginalPolicy(result);
      setRawFields({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pol\u00edtica');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && canAdminPolicies) {
      fetchPolicy();
    }
  }, [isAuthenticated, canAdminPolicies, fetchPolicy]);

  const getDisplayValue = (field: PolicyField) => rawFields[field] ?? String(policy[field]);

  const handleChange = (field: PolicyField, rawValue: string) => {
    setRawFields((prev) => ({ ...prev, [field]: rawValue }));
    if (rawValue === '' || rawValue === '-') return;

    const value = Number(rawValue);
    if (!Number.isNaN(value)) {
      setPolicy((prev) => ({ ...prev, [field]: value }));
    }

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleBlur = (field: PolicyField) => {
    const raw = rawFields[field];
    if (raw === undefined) return;

    const value = Number(raw);
    setPolicy((prev) => ({ ...prev, [field]: Number.isNaN(value) ? 0 : value }));
    setRawFields((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSave = async () => {
    // Validate all fields
    const errors: Partial<Record<PolicyField, string>> = {};
    for (const field of Object.keys(BOUNDS) as PolicyField[]) {
      const err = validateField(field, policy[field]);
      if (err) errors[field] = err;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateSessionPolicy(policy);
      setPolicy(updated);
      setOriginalPolicy(updated);
      setSuccess('Pol\u00edtica de sesi\u00f3n actualizada correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPolicy(originalPolicy);
    setFieldErrors({});
    setError(null);
    setSuccess(null);
  };

  const hasChanges =
    policy.inactivityTimeoutMinutes !== originalPolicy.inactivityTimeoutMinutes ||
    policy.maxSessionDurationHours !== originalPolicy.maxSessionDurationHours ||
    policy.maxConcurrentSessions !== originalPolicy.maxConcurrentSessions;

  /* ---- Auth / Permission gate ---- */
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !canAdminPolicies) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Acceso restringido</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No ten&eacute;s permisos para configurar las pol&iacute;ticas de sesi&oacute;n.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Configuraci&oacute;n de Sesi&oacute;n
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define las pol&iacute;ticas de expiraci&oacute;n y concurrencia de sesiones.
        </p>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Pol&iacute;tica de sesiones</CardTitle>
          <CardDescription>
            Los cambios se aplican a todas las sesiones nuevas. Las sesiones existentes conservan la
            pol&iacute;tica vigente al momento de su creaci&oacute;n.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Error banner */}
              {error && (
                <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Success banner */}
              {success && (
                <div className="rounded-md bg-success/10 px-4 py-3 text-sm text-success">
                  {success}
                </div>
              )}

              {/* Inactivity Timeout */}
              <div className="space-y-2">
                <Label htmlFor="inactivity-timeout">Tiempo de inactividad (minutos)</Label>
                <Input
                  id="inactivity-timeout"
                  type="number"
                  min={BOUNDS.inactivityTimeoutMinutes.min}
                  max={BOUNDS.inactivityTimeoutMinutes.max}
                  value={getDisplayValue('inactivityTimeoutMinutes')}
                  onChange={(e) => handleChange('inactivityTimeoutMinutes', e.target.value)}
                  onBlur={() => handleBlur('inactivityTimeoutMinutes')}
                  error={!!fieldErrors.inactivityTimeoutMinutes}
                />
                {fieldErrors.inactivityTimeoutMinutes && (
                  <p className="text-xs text-destructive">{fieldErrors.inactivityTimeoutMinutes}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Tiempo m&aacute;ximo de inactividad antes de cerrar la sesi&oacute;n
                  autom&aacute;ticamente. Rango: {BOUNDS.inactivityTimeoutMinutes.min}–
                  {BOUNDS.inactivityTimeoutMinutes.max} minutos.
                </p>
              </div>

              {/* Max Duration */}
              <div className="space-y-2">
                <Label htmlFor="max-duration">Duraci&oacute;n m&aacute;xima (horas)</Label>
                <Input
                  id="max-duration"
                  type="number"
                  min={BOUNDS.maxSessionDurationHours.min}
                  max={BOUNDS.maxSessionDurationHours.max}
                  value={getDisplayValue('maxSessionDurationHours')}
                  onChange={(e) => handleChange('maxSessionDurationHours', e.target.value)}
                  onBlur={() => handleBlur('maxSessionDurationHours')}
                  error={!!fieldErrors.maxSessionDurationHours}
                />
                {fieldErrors.maxSessionDurationHours && (
                  <p className="text-xs text-destructive">{fieldErrors.maxSessionDurationHours}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Duraci&oacute;n m&aacute;xima total de una sesi&oacute;n, incluso activa. Rango:{' '}
                  {BOUNDS.maxSessionDurationHours.min}–{BOUNDS.maxSessionDurationHours.max} horas.
                </p>
              </div>

              {/* Max Concurrent Sessions */}
              <div className="space-y-2">
                <Label htmlFor="max-concurrent">Sesiones concurrentes m&aacute;ximas</Label>
                <Input
                  id="max-concurrent"
                  type="number"
                  min={BOUNDS.maxConcurrentSessions.min}
                  max={BOUNDS.maxConcurrentSessions.max}
                  value={getDisplayValue('maxConcurrentSessions')}
                  onChange={(e) => handleChange('maxConcurrentSessions', e.target.value)}
                  onBlur={() => handleBlur('maxConcurrentSessions')}
                  error={!!fieldErrors.maxConcurrentSessions}
                />
                {fieldErrors.maxConcurrentSessions && (
                  <p className="text-xs text-destructive">{fieldErrors.maxConcurrentSessions}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Cantidad m&aacute;xima de sesiones activas simult&aacute;neas por usuario. Rango:{' '}
                  {BOUNDS.maxConcurrentSessions.min}–{BOUNDS.maxConcurrentSessions.max}.
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center gap-3 border-t border-border pt-6">
          <Button onClick={handleSave} disabled={saving || loading || !hasChanges}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving || loading || !hasChanges}
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
