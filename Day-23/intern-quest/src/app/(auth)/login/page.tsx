import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthScreen from '@/components/auth/AuthScreen';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default function LoginPage(props: PageProps<'/login'>) {
  return (
    <Suspense fallback={<main className="auth-screen" />}>
      <AuthScreen mode="login" searchParams={props.searchParams} />
    </Suspense>
  );
}
