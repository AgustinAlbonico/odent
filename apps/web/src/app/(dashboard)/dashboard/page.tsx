'use client';

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@sistema-odontologico/ui';
import { useAuth } from '@/hooks/use-auth';
import { useAbilities } from '@/hooks/use-abilities';
import { Action, Module } from '@sistema-odontologico/permissions';
import { LayoutDashboard, Loader2, ShieldCheck, Stethoscope, Building2 } from 'lucide-react';

const MODULE_LABELS: Partial<Record<Module, string>> = {
  [Module.DASHBOARD]: 'Dashboard',
  [Module.PATIENTS]: 'Pacientes',
  [Module.TURNS]: 'Turnos',
  [Module.CLINICAL_HISTORY]: 'Historia clínica',
  [Module.ODONTOGRAM]: 'Odontograma',
  [Module.PRESCRIPTIONS]: 'Recetas',
  [Module.BUDGETS]: 'Presupuestos',
  [Module.PATIENT_ACCOUNTING]: 'Facturación',
  [Module.GENERAL_ACCOUNTING]: 'Contabilidad',
  [Module.PROFESSIONALS]: 'Profesionales',
  [Module.SYSTEM_CONFIG]: 'Configuración',
  [Module.USERS_ROLES_PERMISSIONS]: 'Usuarios y permisos',
  [Module.AUDIT_ACCESS]: 'Auditoría',
};

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { abilities } = useAbilities();

  const visibleModules = Array.from(
    new Set(
      abilities
        .filter((ability) => ability.action === Action.VIEW_MODULE)
        .map((ability) => MODULE_LABELS[ability.module] ?? ability.module),
    ),
  );

  const canManageProfessionals = abilities.some(
    (ability) =>
      ability.module === Module.PROFESSIONALS &&
      [Action.CREATE, Action.CHANGE_STATUS].includes(ability.action),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Acceso restringido</CardTitle>
            <CardDescription>
              Necesitás una sesión válida para entrar al panel principal.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <LayoutDashboard className="h-4 w-4" />
          Panel principal
        </div>
        <h1 className="text-2xl font-semibold text-foreground">
          Bienvenido, {user.firstName ?? user.email}
        </h1>
        <p className="text-sm text-muted-foreground">
          Este dashboard concentra el estado de acceso actual y los controles sensibles ya conectados en runtime.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Sesión activa</CardDescription>
            <CardTitle className="text-xl">{user.email}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Rol base: <span className="font-medium text-foreground">{user.role}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Institución</CardDescription>
            <CardTitle className="text-xl">{user.tenantId}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              La resolución de permisos y políticas corre sobre este tenant.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Módulos visibles</CardDescription>
            <CardTitle className="text-xl">{visibleModules.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Menú y acceso base calculados desde <code className="font-mono text-xs">/auth/abilities</code>.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Accesos habilitados</CardTitle>
            <CardDescription>
              Resumen rápido de módulos actualmente visibles para esta sesión.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {visibleModules.length > 0 ? (
              visibleModules.map((moduleLabel) => (
                <Badge key={moduleLabel} variant="secondary">
                  {moduleLabel}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay módulos visibles para esta sesión.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Controles sensibles</CardTitle>
            <CardDescription>
              Wiring operativo que ya quedó vivo con esta remediación.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Políticas de sesión</p>
                <p className="text-sm text-muted-foreground">
                  Configuración disponible desde Ajustes con contrato backend real.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Stethoscope className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Crecimiento de profesionales</p>
                <p className="text-sm text-muted-foreground">
                  {canManageProfessionals
                    ? 'Create, activate y reactivate ya validan cupo institucional antes de continuar.'
                    : 'Tu sesión no tiene acciones operativas sobre profesionales.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Separación de controles</p>
                <p className="text-sm text-muted-foreground">
                  Permisos, alcance y restricción por plan siguen evaluándose por capas separadas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
