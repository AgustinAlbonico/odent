import { redirect } from 'next/navigation';

/**
 * Root route — always redirect.
 *
 * - Authenticated → middleware resolves landing path from cookies
 * - Not authenticated → middleware redirects to /login
 */
export default function RootPage() {
  redirect('/dashboard');
}
