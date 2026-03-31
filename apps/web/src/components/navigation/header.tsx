'use client';

import { cn } from '@sistema-odontologico/ui';
import { useAuth } from '@/hooks/use-auth';
import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

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
            className="flex h-8 w-8 items-center justify-center rounded-md cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        {/* Breadcrumb placeholder — can be made dynamic later */}
        <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
          <span>Inicio</span>
        </nav>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-md cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications placeholder */}
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground transition-colors relative"
          aria-label="Notificaciones"
        >
          <Bell size={20} />
        </button>

        {/* User avatar */}
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full',
            'bg-primary text-primary-foreground text-xs font-semibold',
          )}
          title={displayName}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
