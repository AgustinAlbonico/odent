import { type ComponentType } from 'react';
import {
  BarChart3,
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  LayoutDashboard,
  Settings,
  Shield,
  Smile,
  Stethoscope,
  Users,
} from 'lucide-react';
import { Module, type PermissionEntry } from '@sistema-odontologico/permissions';
import { getVisibleNavigationItems } from '../../lib/auth/routing';

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number }>;
  module: Module;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, module: Module.DASHBOARD },
  { label: 'Pacientes', href: '/patients', icon: Users, module: Module.PATIENTS },
  { label: 'Turnos', href: '/appointments', icon: CalendarDays, module: Module.TURNS },
  { label: 'Odontograma', href: '/odontogram', icon: Smile, module: Module.ODONTOGRAM },
  { label: 'Plan de Tratamiento', href: '/treatment-plans', icon: FileText, module: Module.BUDGETS },
  { label: 'Prácticas', href: '/procedures', icon: Stethoscope, module: Module.CLINICAL_HISTORY },
  { label: 'Facturación', href: '/billing', icon: CreditCard, module: Module.PATIENT_ACCOUNTING },
  { label: 'Contabilidad', href: '/accounting', icon: BarChart3, module: Module.GENERAL_ACCOUNTING },
  { label: 'Clínica', href: '/clinic', icon: Building2, module: Module.SYSTEM_CONFIG },
  { label: 'Usuarios', href: '/users', icon: Users, module: Module.USERS_ROLES_PERMISSIONS },
  { label: 'Roles', href: '/roles', icon: Shield, module: Module.USERS_ROLES_PERMISSIONS },
  { label: 'Configuración', href: '/settings', icon: Settings, module: Module.SYSTEM_CONFIG },
];

export function getSidebarNavigationItems(abilities: PermissionEntry[]): NavItem[] {
  return getVisibleNavigationItems(NAV_ITEMS, abilities);
}
