/**
 * HashLink — navigates to a route AND scrolls to an in-page #anchor, working
 * both when already on the target page and when arriving from another route.
 *
 * A plain wouter <Link href="/#how-it-works"> can't do this: wouter navigates
 * with history.pushState, which never triggers the browser's native hash
 * scroll. So the link lands on Home without moving to the section — and does
 * nothing at all when you're already on Home (the path "/" is unchanged, so
 * wouter never re-renders). Pair this with <ScrollToHash/> mounted near the
 * app root, which finishes the scroll after a cross-page navigation paints.
 */
import { useEffect } from "react";
import type { ComponentProps, MouseEvent } from "react";
import { useLocation } from "wouter";

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

type HashLinkProps = ComponentProps<"a"> & { href: string };

export function HashLink({ href, onClick, ...rest }: HashLinkProps) {
  const [location, navigate] = useLocation();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    // Let the browser handle new-tab / modified clicks natively.
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    )
      return;

    const hashIndex = href.indexOf("#");
    const path = (hashIndex === -1 ? href : href.slice(0, hashIndex)) || "/";
    const id = hashIndex === -1 ? "" : href.slice(hashIndex + 1);

    e.preventDefault();
    if (location !== path) {
      // Different route: navigate; ScrollToHash scrolls once it renders.
      navigate(href);
    } else if (id) {
      // Same route: scroll now and reflect the hash in the URL.
      scrollToId(id);
      window.history.replaceState(null, "", href);
    }
  };

  return <a href={href} onClick={handleClick} {...rest} />;
}

/**
 * Mount once near the app root. After any route change, if the URL carries a
 * #hash, scroll to that element once the new page has painted.
 */
export function ScrollToHash() {
  const [location] = useLocation();
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const raf = requestAnimationFrame(() => scrollToId(id));
    return () => cancelAnimationFrame(raf);
  }, [location]);
  return null;
}
