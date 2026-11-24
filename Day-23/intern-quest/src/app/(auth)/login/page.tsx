import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthSkeleton } from '@/components/Skeletons';
import AuthScreen from '@/components/auth/AuthScreen';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default function LoginPage(props: PageProps<'/login'>) {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthScreen mode="login" searchParams={props.searchParams} />
    </Suspense>
  );
}
