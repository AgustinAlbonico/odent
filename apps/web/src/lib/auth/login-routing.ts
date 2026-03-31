import { DEFAULT_AUTHENTICATED_LANDING_PATH } from './routing';

export function normalizeRedirectPath(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  return value;
}

interface PostLoginDestinationInput {
  requiresPasswordChange: boolean;
  redirectUrl: string | null;
  landingPath?: string | null;
}

export function resolvePostLoginDestination({
  requiresPasswordChange,
  redirectUrl,
  landingPath,
}: PostLoginDestinationInput): string {
  if (requiresPasswordChange) {
    return '/forced-password-change';
  }

  return redirectUrl ?? landingPath ?? DEFAULT_AUTHENTICATED_LANDING_PATH;
}
