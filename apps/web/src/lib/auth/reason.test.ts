import { describe, expect, it } from 'vitest';
import { getLoginNotice } from './reason';

describe('getLoginNotice', () => {
  it('maps password reset and forced-change redirects to user-facing login notices', () => {
    expect(getLoginNotice('password_reset')).toEqual({
      tone: 'success',
      message: 'Tu contraseña se restableció correctamente. Ingresá con tu nueva contraseña.',
    });

    expect(getLoginNotice('password_changed')).toEqual({
      tone: 'success',
      message: 'Tu contraseña se actualizó correctamente. Ingresá de nuevo para continuar.',
    });
  });
});
