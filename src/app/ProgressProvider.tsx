// app/ProgressProvider.tsx
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Spinner } from '@/components/Spinner';

function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    // Délai court pour éviter le flash sur les navigations rapides
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!isLoading) return null;
  return <Spinner />;
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <NavigationLoader />
      {children}
    </Suspense>
  );
}