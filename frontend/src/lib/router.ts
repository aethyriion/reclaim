/* Hash routing.
 *
 * Navigate by SETTING window.location.hash so a real history entry is pushed and
 * the browser Back button works. Never pushState/replaceState/location.href —
 * those either kill Back (no history entry) or throw inside the sandboxed
 * preview iframe.
 */

export interface Route {
  head: string;
  arg: string;
  hash: string;
}

export function parse(hash: string): Route {
  const clean = (hash || '#/').replace(/^#\/?/, '');
  const [head = '', arg = ''] = clean.split('/');
  return { head, arg, hash: hash || '#/' };
}

export function current(): Route {
  return parse(window.location.hash);
}

export function navigate(hash: string): void {
  if ((window.location.hash || '#/') !== hash) window.location.hash = hash;
}

export function onChange(fn: (r: Route) => void): () => void {
  const handler = () => fn(current());
  window.addEventListener('hashchange', handler);
  return () => window.removeEventListener('hashchange', handler);
}
