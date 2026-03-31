export interface LoginNotice {
  tone: 'info' | 'success';
  message: string;
}

const LOGIN_NOTICES: Partial<Record<string, LoginNotice>> = {
  session_expired: {
    tone: 'info',
    message: 'Tu sesión expiró. Ingresá de nuevo para continuar.',
  },
  password_reset: {
    tone: 'success',
    message: 'Tu contraseña se restableció correctamente. Ingresá con tu nueva contraseña.',
  },
  password_changed: {
    tone: 'success',
    message: 'Tu contraseña se actualizó correctamente. Ingresá de nuevo para continuar.',
  },
};

export function getLoginNotice(reason: string | null): LoginNotice | null {
  if (!reason) {
    return null;
  }

  return LOGIN_NOTICES[reason] ?? null;
}
