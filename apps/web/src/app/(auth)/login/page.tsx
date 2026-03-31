import { Suspense } from 'react';
import { LoginForm, LoginFormFallback } from '@/lib/auth/login-form';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
