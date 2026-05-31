'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Intercepts all internal link clicks and wraps navigation in the
 * browser's View Transition API (document.startViewTransition).
 * This gives every page navigation a crossfade exit+enter animation.
 */
export function ViewTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Find the nearest <a> ancestor
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Only intercept same-origin internal navigations
      if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#')) return;
      // Skip download / file links
      if (anchor.hasAttribute('download')) return;
      // Respect target="_blank" etc.
      if (anchor.target && anchor.target !== '_self') return;
      // Respect modifier keys (user wants new tab)
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;

      e.preventDefault();

      // Use native View Transition API for smooth crossfade
      if ('startViewTransition' in document) {
        (document as any).startViewTransition(() => {
          router.push(href);
        });
      } else {
        router.push(href);
      }
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [router]);

  return <>{children}</>;
}
