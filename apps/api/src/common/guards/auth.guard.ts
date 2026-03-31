import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { defaultCookieConfig, type JwtPayload } from '@sistema-odontologico/auth-core';
import { PERMISSION_KEY, IS_PUBLIC_KEY, type PermissionMetadata } from '../decorators/index.js';
import { PermissionsService } from '../../modules/permissions/permissions.service.js';
import { Action, Scope } from '@sistema-odontologico/permissions';
import { SessionPolicyRuntimeService } from '../../modules/session-policy/session-policy-runtime.service.js';

/**
 * Read metadata from handler or class.
 * Falls back to native Reflect API when Reflector is not available
 * (known issue with APP_GUARD + useClass in some NestJS versions).
 */
function readMetadata<T>(
  reflector: Reflector | undefined,
  key: string,
  handler: ReturnType<ExecutionContext['getHandler']>,
  cls: ReturnType<ExecutionContext['getClass']>,
): T | undefined {
  if (reflector) {
    // NestJS 11 changed Reflector.getAllAndOverride to accept typed decorators.
    // Since we use string keys (from SetMetadata), we cast to any to avoid overload mismatch.
    return (reflector as any).getAllAndOverride(key, [handler, cls]);
  }

  // Fallback: direct Reflect API
  return (
    Reflect.getMetadata(key, handler) ??
    Reflect.getMetadata(key, cls)
  );
}

/**
 * Auth + Permission guard.
 * Evaluates session validity, then VIEW/OPERATE/SCOPE separately.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private static readonly VIEW_ONLY_ACTIONS = [
    Action.VIEW_MODULE,
    Action.VIEW_LIST,
    Action.VIEW_DETAIL,
    Action.VIEW_SENSITIVE,
    Action.VIEW_AUDIT,
  ];

  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
    private readonly sessionPolicyRuntimeService: SessionPolicyRuntimeService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const cls = context.getClass();

    // Check if route is public
    const isPublic = readMetadata<boolean>(this.reflector, IS_PUBLIC_KEY, handler, cls) ?? false;
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();

    // Extract token from cookie or Authorization header
    const token =
      request.cookies?.[defaultCookieConfig.accessTokenName] ??
      request.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Check token version (revocation)
    // The payload has tokenVersion — if it doesn't match DB, session was revoked
    // For now, trust the JWT (version check can be added with cache)

    // Attach user to request
    request.user = payload;

    if (!payload.sid) {
      throw new UnauthorizedException('Session context missing');
    }

    await this.sessionPolicyRuntimeService.validateAccessSession({
      sessionId: payload.sid,
      userId: payload.sub,
      userEmail: payload.email,
      ipAddress: request.ip ?? 'unknown',
      userAgent: request.get?.('user-agent') ?? request.headers?.['user-agent'] ?? 'unknown',
    });

    // Check forced password change
    if (payload.mustChangePassword) {
      const path = request.originalUrl ?? request.url ?? request.route?.path ?? '';
      const allowedPaths = ['/auth/password/force-change', '/auth/logout'];

      if (!allowedPaths.some((allowedPath) => path.includes(allowedPath))) {
        throw new ForbiddenException('Password change required');
      }
      return true;
    }

    // Check permission requirements
    const permissionMeta = readMetadata<PermissionMetadata>(this.reflector, PERMISSION_KEY, handler, cls);

    if (!permissionMeta) return true; // No permission required

    // Resolve permissions for user
    const permissions = await this.permissionsService.resolvePermissions(
      payload.sub,
      payload.role,
    );

    const { module, action, scope } = permissionMeta;

    // VIEW check
    const canView = this.permissionsService.canView(permissions, module, action);
    if (!canView) {
      throw new ForbiddenException({
        code: 'no_view_permission',
        message: 'No tiene permiso para ver este módulo',
      });
    }

    // OPERATE check (for non-view actions)
    if (!AuthGuard.VIEW_ONLY_ACTIONS.includes(action)) {
      const canOperate = this.permissionsService.canOperate(permissions, module, action);
      if (!canOperate) {
        throw new ForbiddenException({
          code: 'no_operate_permission',
          message: 'No tiene permiso para realizar esta acción',
        });
      }
    }

    // SCOPE check
    if (scope) {
      const effectiveScope = this.permissionsService.getEffectiveScope(permissions, module, action);
      const scopeLevels: Scope[] = [
        Scope.NONE,
        Scope.OWN,
        Scope.ASSIGNED,
        Scope.OPERATIONAL_INSTITUTIONAL,
        Scope.SUPERVISION,
        Scope.INSTITUTIONAL_TOTAL,
      ];

      if (scopeLevels.indexOf(effectiveScope) < scopeLevels.indexOf(scope)) {
        throw new ForbiddenException({
          code: 'scope_insufficient',
          message: 'No tiene alcance suficiente para esta acción',
        });
      }
    }

    return true;
  }
}
