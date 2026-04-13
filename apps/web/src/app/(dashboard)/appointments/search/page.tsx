'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useAbilities } from '@/hooks/use-abilities';
import { Module, Action } from '@sistema-odontologico/permissions';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Input,
  SkeletonTable,
} from '@sistema-odontologico/ui';
import {
  getAppointments,
  getProfessionals,
  type AppointmentListItem,
  type PaginatedResponse,
  type ProfessionalSelectItem,
} from '@/lib/appointments-api';
import { StatusBadge } from '@/components/appointments/shared/StatusBadge';
import {
  Search,
  Filter,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarSearch,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PAGE_SIZE = 20;

export default function SearchPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasAbility } = useAbilities();
  const canView = hasAbility(Module.TURNS, Action.VIEW_LIST);

  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [professionals, setProfessionals] = useState<ProfessionalSelectItem[]>([]);

  const STATUS_OPTIONS = [
    { value: '', label: 'Todos' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'waiting', label: 'En espera' },
    { value: 'attended', label: 'Atendido' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'no_show', label: 'Ausente' },
  ];

  useEffect(() => {
    let cancelled = false;
    getProfessionals()
      .then((data) => {
        if (!cancelled) setProfessionals(data);
      })
      .catch(() => {
        if (!cancelled) setProfessionals([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const result: PaginatedResponse<AppointmentListItem> = await getAppointments({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        professionalId: professionalId || undefined,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setAppointments(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, professionalId, status, dateFrom, dateTo]);

  useEffect(() => {
    if (isAuthenticated && canView) {
      fetchAppointments();
    }
  }, [isAuthenticated, canView, fetchAppointments]);

  const handleSearch = () => {
    setPage(1);
    fetchAppointments();
  };

  const handleReset = () => {
    setSearch('');
    setProfessionalId('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <CalendarSearch className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No tenés permisos para buscar turnos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros de búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Label htmlFor="search-apt" className="text-sm">
                Buscar
              </Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-apt"
                  placeholder="Paciente, profesional..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="search-professional" className="text-sm">
                Profesional
              </Label>
              <select
                id="search-professional"
                value={professionalId}
                onChange={(e) => setProfessionalId(e.target.value)}
                className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Todos</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="search-status" className="text-sm">
                Estado
              </Label>
              <select
                id="search-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="search-date-from" className="text-sm">
                Desde
              </Label>
              <Input
                id="search-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="min-w-[150px]">
              <Label htmlFor="search-date-to" className="text-sm">
                Hasta
              </Label>
              <Input
                id="search-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button variant="ghost" onClick={handleReset}>
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <SkeletonTable rows={5} columns={7} showHeader />
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <CalendarSearch className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No se encontraron turnos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Fecha
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Hora
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Paciente
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Profesional
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Obra Social
                    </th>
                    <th className="text-left text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Estado
                    </th>
                    <th className="text-right text-sm font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr
                      key={apt.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors duration-150 ease-out"
                    >
                      <td className="px-4 py-3 text-sm">
                        {format(new Date(apt.startAt), 'dd/MM/yyyy', { locale: es })}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono tabular-nums">
                        {format(new Date(apt.startAt), 'HH:mm')}
                      </td>
                      <td className="px-4 py-3 text-sm">{apt.patientName}</td>
                      <td className="px-4 py-3 text-sm">{apt.professionalName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {apt.mutualName ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={apt.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/appointments/${apt.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {!loading && appointments.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {appointments.length} de {total} turnos
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
