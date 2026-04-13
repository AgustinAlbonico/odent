'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn, hoverTransition } from '@sistema-odontologico/ui';
import { useAuth } from '@/hooks/use-auth';
import { useAbilities } from '@/hooks/use-abilities';
import { getSidebarNavigationItems } from './sidebar-navigation';
import { ChevronLeft, LogOut, UserCircle } from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export function Sidebar({ mobileOpen = false, onMobileOpenChange }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { abilities } = useAbilities();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = getSidebarNavigationItems(abilities);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
    onMobileOpenChange?.(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar menú lateral"
        className={cn(
          'fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[1px] transition-opacity md:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => onMobileOpenChange?.(false)}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-border bg-card transition-[width,transform] duration-200 ease-out md:static md:z-auto',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Logo / App name */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && <span className="text-lg font-bold text-primary">DentalSoft</span>}
          <button
            type="button"
            onClick={() => {
              if (mobileOpen) {
                onMobileOpenChange?.(false);
                return;
              }

              setCollapsed(!collapsed);
            }}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md cursor-pointer text-muted-foreground',
              'hover:bg-muted hover:text-foreground',
              hoverTransition,
              collapsed && 'mx-auto',
            )}
            aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            <ChevronLeft
              size={20}
              className={cn(
                'transition-transform duration-200',
                collapsed && 'rotate-180',
                mobileOpen && 'md:rotate-0',
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {visibleItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => onMobileOpenChange?.(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                      hoverTransition,
                      isActive
                        ? 'bg-primary-subtle text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      collapsed && 'justify-center px-0',
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={20} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-border p-4">
          {user && !collapsed && (
            <div className="mb-2 text-sm">
              <p className="font-medium text-foreground truncate">
                {user.firstName || user.lastName
                  ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
                  : user.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          <Link
            href="/security/perfil"
            onClick={() => onMobileOpenChange?.(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground',
              'hover:bg-muted hover:text-foreground w-full',
              hoverTransition,
              collapsed && 'justify-center px-0',
            )}
            title={collapsed ? 'Mi perfil' : undefined}
          >
            <UserCircle size={20} />
            {!collapsed && <span>Mi perfil</span>}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer text-muted-foreground',
              'hover:bg-muted hover:text-foreground w-full',
              hoverTransition,
              collapsed && 'justify-center px-0',
            )}
            title={collapsed ? 'Cerrar sesión' : undefined}
          >
            <LogOut size={20} />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
