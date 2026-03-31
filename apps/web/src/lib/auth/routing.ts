import {
  Action,
  BaseRole,
  Module,
  Scope,
  type PermissionEntry,
} from '@sistema-odontologico/permissions';

export const LANDING_PATH_COOKIE = 'so_landing_path';
export const AUTHORIZED_ROUTES_COOKIE = 'so_authorized_routes';
export const DEFAULT_AUTHENTICATED_LANDING_PATH = '/security';

type RoleLike = BaseRole | string | null | undefined;

interface NavigationItemLike {
  href: string;
  module: Module;
}

interface ProtectedRoutePolicy {
  path: string;
  authOnly?: boolean;
  anyOf?: Array<{
    module: Module;
    actions: Action[];
  }>;
}

const PROTECTED_ROUTE_POLICIES: ProtectedRoutePolicy[] = [
  {
    path: '/dashboard',
    anyOf: [{ module: Module.DASHBOARD, actions: [Action.VIEW_MODULE] }],
  },
  { path: '/security', authOnly: true },
  {
    path: '/settings',
    anyOf: [{ module: Module.SYSTEM_CONFIG, actions: [Action.ADMIN_POLICIES] }],
  },
  {
    path: '/sessions',
    anyOf: [
      { module: Module.SYSTEM_CONFIG, actions: [Action.ADMIN_USERS, Action.CLOSE_SESSION_ADMIN] },
    ],
  },
  {
    path: '/audit',
    anyOf: [{ module: Module.AUDIT_ACCESS, actions: [Action.VIEW_AUDIT] }],
  },
  {
    path: '/permission-reviews',
    anyOf: [
      {
        module: Module.USERS_ROLES_PERMISSIONS,
        actions: [Action.ADMIN_ROLES_PERMISSIONS],
      },
    ],
  },
];

const LANDING_PRIORITY_BY_ROLE: Record<string, string[]> = {
  [BaseRole.ADMIN]: ['/settings', '/sessions', '/audit', '/permission-reviews', '/dashboard', '/security'],
  [BaseRole.PROFESIONAL]: ['/dashboard', '/security', '/audit', '/settings', '/sessions', '/permission-reviews'],
  [BaseRole.ASISTENTE]: ['/dashboard', '/security', '/sessions', '/settings', '/audit', '/permission-reviews'],
  [BaseRole.PROFESIONAL_SUPERVISOR]: ['/dashboard', '/security', '/audit', '/sessions', '/settings', '/permission-reviews'],
};

function hasAbility(
  abilities: PermissionEntry[],
  module: Module,
  action: Action,
): boolean {
  return abilities.some(
    (ability) =>
      ability.module === module &&
      ability.action === action &&
      ability.scope !== Scope.NONE,
  );
}

function canAccessPolicy(policy: ProtectedRoutePolicy, abilities: PermissionEntry[]): boolean {
  if (policy.authOnly) {
    return true;
  }

  return (
    policy.anyOf?.some((requirement) =>
      requirement.actions.some((action) => hasAbility(abilities, requirement.module, action)),
    ) ?? false
  );
}

function getLandingOrder(role: RoleLike): string[] {
  return LANDING_PRIORITY_BY_ROLE[String(role ?? '').toLowerCase()] ?? ['/dashboard', '/security', '/settings', '/sessions', '/audit', '/permission-reviews'];
}

function safeDecodeCookie(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`;
}

export function clearAuthRoutingSnapshot() {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${LANDING_PATH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${AUTHORIZED_ROUTES_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getVisibleNavigationItems<T extends NavigationItemLike>(
  items: T[],
  abilities: PermissionEntry[],
): T[] {
  return items.filter((item) => hasAbility(abilities, item.module, Action.VIEW_MODULE));
}

export function getAuthorizedProtectedPaths(abilities: PermissionEntry[]): string[] {
  return PROTECTED_ROUTE_POLICIES.filter((policy) => canAccessPolicy(policy, abilities)).map(
    (policy) => policy.path,
  );
}

export function resolveRoleFallbackLanding(role: RoleLike): string {
  return getLandingOrder(role)[0] ?? DEFAULT_AUTHENTICATED_LANDING_PATH;
}

export function resolveContextualLandingPath(
  role: RoleLike,
  abilities: PermissionEntry[],
): string {
  const authorizedPaths = new Set(getAuthorizedProtectedPaths(abilities));

  for (const path of getLandingOrder(role)) {
    if (authorizedPaths.has(path)) {
      return path;
    }
  }

  return DEFAULT_AUTHENTICATED_LANDING_PATH;
}

export function persistAuthRoutingSnapshot(
  user: { role: string },
  abilities: PermissionEntry[],
) {
  const landingPath = resolveContextualLandingPath(user.role, abilities);
  const authorizedPaths = getAuthorizedProtectedPaths(abilities);

  writeCookie(LANDING_PATH_COOKIE, landingPath);
  writeCookie(AUTHORIZED_ROUTES_COOKIE, authorizedPaths.join(','));
}

export function parseAuthorizedRoutesCookie(value: string | null | undefined): Set<string> {
  const decoded = safeDecodeCookie(value);
  return new Set(
    decoded
      .split(',')
      .map((path) => path.trim())
      .filter((path) => path.startsWith('/')),
  );
}

export function parseLandingPathCookie(value: string | null | undefined): string | null {
  const decoded = safeDecodeCookie(value);
  return decoded.startsWith('/') ? decoded : null;
}

function getProtectedRoutePolicy(pathname: string): ProtectedRoutePolicy | null {
  return (
    PROTECTED_ROUTE_POLICIES.find(
      (policy) => pathname === policy.path || pathname.startsWith(`${policy.path}/`),
    ) ?? null
  );
}

export function isAuthorizedProtectedRoute(pathname: string, authorizedRoutes: Set<string>): boolean {
  const policy = getProtectedRoutePolicy(pathname);
  if (!policy) {
    return true;
  }

  return authorizedRoutes.has(policy.path);
}

export function resolveAuthorizedLandingPath(
  role: RoleLike,
  authorizedRoutes: Set<string>,
  preferredLandingPath?: string | null,
): string {
  if (preferredLandingPath && authorizedRoutes.has(preferredLandingPath)) {
    return preferredLandingPath;
  }

  for (const path of getLandingOrder(role)) {
    if (authorizedRoutes.has(path)) {
      return path;
    }
  }

  return DEFAULT_AUTHENTICATED_LANDING_PATH;
}
