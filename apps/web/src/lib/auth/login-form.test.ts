/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  normalizeRedirectPath,
  resolvePostLoginDestination,
} from './login-routing';
import { LoginForm } from './login-form';

let container: HTMLDivElement | null = null;
let root: Root | null = null;

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  login: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
  useSearchParams: () => mocks.searchParams,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    login: mocks.login,
    isLoading: false,
  }),
}));

describe('login redirect contract', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    mocks.push.mockReset();
    mocks.refresh.mockReset();
    mocks.login.mockReset();
    mocks.searchParams = new URLSearchParams();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    root = null;
    container = null;
  });

  async function renderForm() {
    await act(async () => {
      root?.render(React.createElement(LoginForm));
    });
  }

  function setInputValue(selector: string, value: string) {
    const input = container?.querySelector<HTMLInputElement>(selector);

    if (!input) {
      throw new Error(`Input ${selector} not found`);
    }

    const valueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set;

    if (!valueSetter) {
      throw new Error(`Value setter missing for ${selector}`);
    }

    act(() => {
      valueSetter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  async function submitForm() {
    const button = container?.querySelector<HTMLButtonElement>('button[type="submit"]');

    if (!button) {
      throw new Error('Submit button not found');
    }

    await act(async () => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });
  }

  it('preserves contextual redirect targets that include query params', () => {
    expect(normalizeRedirectPath('/audit?tab=security&filter=open')).toBe(
      '/audit?tab=security&filter=open',
    );
  });

  it('rejects unsafe external redirect targets', () => {
    expect(normalizeRedirectPath('https://evil.example')).toBeNull();
    expect(normalizeRedirectPath('//evil.example')).toBeNull();
  });

  it('prioritizes the preserved redirect target after login', () => {
    expect(
      resolvePostLoginDestination({
        requiresPasswordChange: false,
        redirectUrl: '/audit?tab=security',
        landingPath: '/sessions',
      }),
    ).toBe('/audit?tab=security');
  });

  it('falls back to the contextual landing path when no redirect target exists', () => {
    expect(
      resolvePostLoginDestination({
        requiresPasswordChange: false,
        redirectUrl: null,
        landingPath: '/sessions',
      }),
    ).toBe('/sessions');
  });

  it('forces the password-change route before any other destination', () => {
    expect(
      resolvePostLoginDestination({
        requiresPasswordChange: true,
        redirectUrl: '/audit?tab=security',
        landingPath: '/sessions',
      }),
    ).toBe('/forced-password-change');
  });

  it('submits successfully and redirects to the contextual landing path', async () => {
    mocks.login.mockResolvedValue({
      requiresPasswordChange: false,
      landingPath: '/sessions',
    });

    await renderForm();

    setInputValue('#email', 'admin@clinic.test');
    setInputValue('#password', 'supersecret');
    await submitForm();

    await act(async () => {
      await Promise.resolve();
    });

    expect(mocks.login).toHaveBeenCalledWith('admin@clinic.test', 'supersecret');
    expect(mocks.push).toHaveBeenCalledWith('/sessions');
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });
});
