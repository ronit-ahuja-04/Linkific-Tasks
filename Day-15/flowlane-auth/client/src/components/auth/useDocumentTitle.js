import { useEffect } from 'react';

// Sets the tab title ("Sign in · FlowLane"). Screen readers announce it on navigation.
export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = `${title} · FlowLane`;
  }, [title]);
}
