'use client';

import { Tabs, TabsList, TabsTrigger } from '@sistema-odontologico/ui';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Calendar, Search, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const ALL_TABS = [
  { value: 'calendar', label: 'Calendario', icon: Calendar, href: '/appointments/calendar' },
  { value: 'search', label: 'Búsqueda', icon: Search, href: '/appointments/search' },
  { value: 'schedules', label: 'Horarios', icon: Clock, href: '/appointments/schedules' },
  {
    value: 'exceptions',
    label: 'Excepciones',
    icon: AlertCircle,
    href: '/appointments/exceptions',
  },
];

/** Tabs visible per role. Schedules are professional-only (they manage their own hours). */
const ROLE_HIDDEN_TABS: Record<string, string[]> = {
  recepcionista: ['schedules'],
};

export default function AppointmentsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const isProfessional = user?.role === 'profesional';
  const hiddenTabs: string[] = (user?.role && ROLE_HIDDEN_TABS[user.role]) || [];

  const visibleTabs = useMemo(
    () =>
      ALL_TABS.filter((tab) => {
        if (isProfessional && tab.value === 'exceptions') return false;
        if (hiddenTabs.includes(tab.value)) return false;
        return true;
      }),
    [isProfessional, hiddenTabs],
  );

  useEffect(() => {
    if (isLoading) return;
    // Professional cannot access exceptions tab
    if (isProfessional && pathname.startsWith('/appointments/exceptions')) {
      router.replace('/appointments/calendar');
    }
    // Roles with hidden tabs get redirected away
    if (hiddenTabs.length > 0) {
      const blocked = hiddenTabs.some((t) => {
        const entry = ALL_TABS.find((a) => a.value === t);
        return entry && pathname.startsWith(entry.href);
      });
      if (blocked) router.replace('/appointments/calendar');
    }
  }, [isLoading, isProfessional, pathname, router, hiddenTabs]);

  const activeTab = visibleTabs.find((t) => pathname.startsWith(t.href))?.value ?? 'calendar';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Turnos y Agenda</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isProfessional
            ? 'Gestioná tu agenda semanal, tus turnos y tus horarios'
            : hiddenTabs.includes('schedules')
              ? 'Vista semanal de todos los turnos y gestión de excepciones'
              : 'Gestión de turnos, horarios y excepciones'}
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v: string) => {
          const tab = ALL_TABS.find((t) => t.value === v);
          if (tab) router.push(tab.href);
        }}
      >
        <TabsList>
          {visibleTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {children}
    </div>
  );
}
