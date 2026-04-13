'use client';

import { Action, Module } from '@sistema-odontologico/permissions';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  SkeletonTable,
} from '@sistema-odontologico/ui';
import { ChevronLeft, ChevronRight, Loader2, Search, Stethoscope } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAbilities } from '@/hooks/use-abilities';
import { useAuth } from '@/hooks/use-auth';
import { getProfessionalsList, type ProfessionalListItem } from '@/lib/auth/api';

const PAGE_SIZE = 20;

function getStateBadgeVariant(state: string): 'success' | 'secondary' {
  return state === 'active' ? 'success' : 'secondary';
}

function getStateLabel(state: string): string {
  return state === 'active' ? 'Activo' : 'Inactivo';
}

export default function ProfessionalsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasAbility } = useAbilities();

  const canView = hasAbility(Module.PROFESSIONALS, Action.VIEW_LIST);

  const [professionals, setProfessionals] = useState<ProfessionalListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfessionals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getProfessionalsList({
        search: searchFilter.trim() || undefined,
        page,
        limit: PAGE_SIZE,
      });

      setProfessionals(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar profesionales.');
    } finally {
      setLoading(false);
    }
  }, [page, searchFilter]);

  const handleSearchSubmit = useCallback(() => {
    if (page === 1) {
      fetchProfessionals();
      return;
    }

    setPage(1);
  }, [fetchProfessionals, page]);

  useEffect(() => {
    if (isAuthenticated && canView) {
      fetchProfessionals();
    }
  }, [canView, fetchProfessionals, isAuthenticated]);

  if (authLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !canView) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <Stethoscope className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No tenés permisos para ver profesionales.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profesionales</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Directorio de profesionales con acceso a ficha completa, mutuales y agenda operativa.
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, apellido o email..."
                value={searchFilter}
                onChange={(event) => setSearchFilter(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleSearchSubmit();
                  }
                }}
                className="pl-9"
              />
            </div>
            <Button type="button" onClick={handleSearchSubmit}>
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <SkeletonTable rows={5} columns={6} showHeader />
          ) : professionals.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Stethoscope className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No se encontraron profesionales.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider text-muted-foreground">
                      Foto
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider text-muted-foreground">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider text-muted-foreground">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider text-muted-foreground">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium uppercase tracking-wider text-muted-foreground">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {professionals.map((professional) => (
                    <tr
                      key={professional.id}
                      className="border-b border-border transition-colors duration-150 ease-out hover:bg-muted/50"
                    >
                      <td className="px-4 py-3">
                        <Avatar
                          src={professional.photoUrl}
                          alt={`${professional.firstName} ${professional.lastName}`}
                          fallback={`${professional.firstName.charAt(0)}${professional.lastName.charAt(0)}`}
                          size="sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {professional.firstName} {professional.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {professional.email}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStateBadgeVariant(professional.state)}>
                          {getStateLabel(professional.state)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/professionals/${professional.id}`)}
                        >
                          Ver ficha
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {!loading && professionals.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? 'profesional' : 'profesionales'}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
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
