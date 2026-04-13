'use client';

import { Avatar, Badge, cn, hoverTransition } from '@sistema-odontologico/ui';
import { useAuth } from '@/hooks/use-auth';
import { useAbilities } from '@/hooks/use-abilities';
import { Menu, Bell, Sun, Moon, Search, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { searchPatientsGlobal, type PatientSearchResult } from '@/lib/auth/api';
import { Module, Action } from '@sistema-odontologico/permissions';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

function getStateLabel(state: string): string {
  return state === 'active' ? 'Activo' : 'Inactivo';
}

function getStateBadgeVariant(state: string): 'success' | 'secondary' {
  return state === 'active' ? 'success' : 'secondary';
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user } = useAuth();
  const { hasAbility } = useAbilities();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);

  // Global search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canViewPatients = hasAbility(Module.PATIENTS, Action.VIEW_LIST);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || !searchOpen) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchPatientsGlobal(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Ctrl+K to open search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchFocused(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleSelectPatient(patientId: string) {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    router.push(`/patients?id=${patientId}`);
  }

  function toggleTheme() {
    setDarkMode((prev) => !prev);
    document.documentElement.classList.toggle('dark');
  }

  const displayName = user
    ? user.firstName || user.lastName
      ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
      : user.email
    : undefined;

  const initials = user
    ? displayName
        ?.split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || '??'
    : '??';

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-md cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground md:hidden',
              hoverTransition,
            )}
            aria-label="Abrir menú lateral"
          >
            <Menu size={20} />
          </button>
        )}
        {/* Breadcrumb placeholder — can be made dynamic later */}
        <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
          <span>Inicio</span>
        </nav>
      </div>

      {/* Center section — Global search */}
      {canViewPatients && (
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar paciente... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!searchOpen) setSearchOpen(true);
              }}
              onFocus={() => {
                setSearchFocused(true);
                if (!searchOpen) setSearchOpen(true);
              }}
              className={cn(
                'h-9 w-40 rounded-lg border border-border bg-muted/50 pl-9 pr-8 text-sm sm:w-64',
                'placeholder:text-muted-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'transition-all duration-150',
                searchFocused && 'bg-background sm:w-80',
              )}
              aria-label="Buscar paciente"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  inputRef.current?.focus();
                }}
                className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground',
                  hoverTransition,
                )}
                aria-label="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search dropdown */}
          {searchOpen && (searchFocused || searchQuery) && (
            <div
              className="absolute top-full left-0 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-border bg-background shadow-md z-50"
              role="listbox"
              aria-label="Resultados de búsqueda"
            >
              {searchLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Buscando...</span>
                </div>
              ) : searchQuery && searchResults.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No se encontraron pacientes para &quot;{searchQuery}&quot;
                  </p>
                </div>
              ) : searchResults.length > 0 ? (
                <ul className="py-1 max-h-72 overflow-y-auto">
                  {searchResults.map((patient) => (
                    <li key={patient.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectPatient(patient.id)}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-muted/50',
                          hoverTransition,
                        )}
                        role="option"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {patient.firstName} {patient.lastName}
                          </p>
                          {patient.dni && (
                            <p className="text-xs text-muted-foreground font-mono">
                              DNI: {patient.dni}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={getStateBadgeVariant(patient.state)}
                          className="shrink-0 text-xs"
                        >
                          {getStateLabel(patient.state)}
                        </Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Escribí un nombre, apellido o DNI para buscar
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground',
            hoverTransition,
          )}
          aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications placeholder */}
        <button
          type="button"
          className={cn(
            'relative flex h-8 w-8 items-center justify-center rounded-md cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground',
            hoverTransition,
          )}
          aria-label="Notificaciones"
        >
          <Bell size={20} />
        </button>

        {/* User avatar — links to profile */}
        <a
          href="/security/perfil"
          className={cn(
            'flex items-center gap-2 rounded-lg px-2 py-1 cursor-pointer hover:bg-muted',
            hoverTransition,
          )}
          aria-label="Mi perfil"
        >
          <Avatar src={user?.photoUrl} alt={displayName} fallback={initials} size="sm" />
          <span className="hidden text-sm font-medium text-foreground sm:inline">
            {displayName}
          </span>
        </a>
      </div>
    </header>
  );
}
