import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { content } from './content'
import { eggId, loadFound, saveFound, totalSecrets } from './lib/secrets'

interface Secrets {
  found: Set<string>
  total: number
  allFound: boolean
  markFound: (eraId: string, icon: string) => void
}

const SecretsContext = createContext<Secrets | null>(null)

/** Tracks which easter eggs she has opened; persists across visits. */
export function SecretsProvider({ children }: { children: ReactNode }) {
  const [found, setFound] = useState<Set<string>>(loadFound)

  const markFound = useCallback((eraId: string, icon: string) => {
    setFound((prev) => {
      const id = eggId(eraId, icon)
      return prev.has(id) ? prev : new Set(prev).add(id)
    })
  }, [])

  // persist as an effect, not inside the updater — updaters must stay
  // pure (StrictMode double-invokes them)
  useEffect(() => {
    if (found.size > 0) saveFound(found)
  }, [found])

  const value = useMemo<Secrets>(() => {
    const total = totalSecrets(content.eras)
    return { found, total, allFound: found.size >= total, markFound }
  }, [found, markFound])

  return <SecretsContext.Provider value={value}>{children}</SecretsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- tiny hook, co-located by design
export function useSecrets(): Secrets {
  const ctx = useContext(SecretsContext)
  if (!ctx) throw new Error('useSecrets must be used within SecretsProvider')
  return ctx
}
