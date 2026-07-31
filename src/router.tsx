import { createContext, useContext, useEffect, useMemo, useState, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react'

interface RouterValue { path: string; search: string; navigate: (to: string, replace?: boolean) => void }
const RouterContext = createContext<RouterValue | null>(null)

export function RouterProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState(() => ({ path: window.location.pathname, search: window.location.search }))
  useEffect(() => { const update = () => setLocation({ path: window.location.pathname, search: window.location.search }); addEventListener('popstate', update); return () => removeEventListener('popstate', update) }, [])
  const value = useMemo<RouterValue>(() => ({ ...location, navigate(to, replace = false) { if (replace) history.replaceState(null, '', to); else history.pushState(null, '', to); setLocation({ path: window.location.pathname, search: window.location.search }); window.scrollTo({ top: 0, behavior: 'smooth' }) } }), [location])
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export const useRouter = () => { const value = useContext(RouterContext); if (!value) throw new Error('Router context is missing.'); return value }
export const usePath = () => useRouter().path
export const useNavigate = () => useRouter().navigate
export const useSearchParams = () => new URLSearchParams(useRouter().search)

export function Link({ to, children, onClick, ...props }: { to: string; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const navigate = useNavigate()
  const follow = (event: MouseEvent<HTMLAnchorElement>) => { onClick?.(event); if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate(to) }
  return <a href={to} onClick={follow} {...props}>{children}</a>
}

