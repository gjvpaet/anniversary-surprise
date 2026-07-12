import { useSecrets } from '../SecretsContext'

interface Props {
  onOpenVault: () => void
}

/**
 * The hunt's scoreboard — fixed bottom-right, mirroring the audio
 * button bottom-left. Hidden until the first egg is found (before
 * that it would spoil the surprise; the pulsing halos invite the
 * first tap). Once every secret is open it becomes the vault key.
 */
export default function SecretsCounter({ onOpenVault }: Props) {
  const { found, total, allFound } = useSecrets()

  if (found.size === 0) return null

  if (!allFound) {
    return (
      <p
        role="status"
        className="fixed right-4 bottom-4 z-40 rounded-full bg-white/95 px-4 py-2.5 font-hand text-lg leading-none text-ink shadow-md ring-2 ring-rose/40"
      >
        {found.size} / {total} secrets
      </p>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpenVault}
      aria-label="Open the vault of extra photos"
      className="fixed right-4 bottom-4 z-40 flex cursor-pointer items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 font-hand text-lg leading-none text-rose shadow-md ring-2 ring-rose/40"
    >
      <span aria-hidden className="relative flex h-4 w-4 items-center justify-center">
        <span className="egg-ping absolute inset-0 rounded-full bg-rose/50" />
        🔓
      </span>
      open the vault
    </button>
  )
}
