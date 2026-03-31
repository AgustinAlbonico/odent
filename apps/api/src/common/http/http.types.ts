export type AuthenticatedRequest = {
  user?: {
    sub: string;
    email?: string;
    role?: string;
    tid?: string;
    mustChangePassword?: boolean;
  };
  ip?: string;
  url?: string;
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string | undefined>;
  params: Record<string, string | undefined>;
  get(name: string): string | undefined;
};

export type HttpResponse = {
  cookie(name: string, value: string, options?: Record<string, unknown>): void;
  clearCookie(name: string): void;
  setHeader(name: string, value: string): void;
};
