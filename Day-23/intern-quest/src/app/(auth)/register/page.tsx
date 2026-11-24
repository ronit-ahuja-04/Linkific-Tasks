import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthSkeleton } from '@/components/Skeletons';
import AuthScreen from '@/components/auth/AuthScreen';

export const metadata: Metadata = { title: 'Create an account', robots: { index: false } };

export default function RegisterPage(props: PageProps<'/register'>) {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthScreen mode="register" searchParams={props.searchParams} />
    </Suspense>
  );
}
