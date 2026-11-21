import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthScreen from '@/components/auth/AuthScreen';

export const metadata: Metadata = { title: 'Create an account', robots: { index: false } };

export default function RegisterPage(props: PageProps<'/register'>) {
  return (
    <Suspense fallback={<main className="auth-screen" />}>
      <AuthScreen mode="register" searchParams={props.searchParams} />
    </Suspense>
  );
}
