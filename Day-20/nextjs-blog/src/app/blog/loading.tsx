import { ListSkeleton } from '@/components/Skeletons';

/** loading.tsx: shown instantly while anything under /blog streams in. It wraps the segment in a Suspense boundary for you. */
export default function Loading() {
  return (
    <>
      <h1>Blog</h1>
      <ListSkeleton />
    </>
  );
}
