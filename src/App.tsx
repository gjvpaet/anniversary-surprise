import { useEffect, useState } from 'react'
import { content } from './content'
import type { Polaroid } from './content'
import { isUnlocked } from './lib/gate'
import Gate from './components/Gate'
import Opening from './components/Opening'
import EraSection from './components/EraSection'
import ChapterNav from './components/ChapterNav'
import AudioPlayer from './components/AudioPlayer'
import SecretsCounter from './components/SecretsCounter'
import Lightbox from './components/Lightbox'
import VaultOverlay from './components/VaultOverlay'
import VideoOverlay from './components/VideoOverlay'
import Finale from './components/Finale'

/**
 * The scroll world: opening overlook → six pinned era scenes →
 * 9th island → polaroid-swirl letter finale. Day 3 adds the
 * lightbox (tap any polaroid) and the persistent song control.
 */
export default function App() {
  const [unlocked, setUnlocked] = useState(isUnlocked)
  const [activeChapter, setActiveChapter] = useState(0)
  // one lightbox serves both the era fans and the vault deck
  const [lightbox, setLightbox] = useState<{ polaroids: Polaroid[]; index: number } | null>(null)
  const [vaultOpen, setVaultOpen] = useState(false)
  const [video, setVideo] = useState<string | null>(null)

  // Pause "our song" while a video plays. Lives here (keyed on state, an
  // UPDATE effect) rather than in VideoOverlay's mount effect, which dev
  // StrictMode double-invokes — that interleaves a stray resume-song and
  // breaks the AudioPlayer's resume flag.
  useEffect(() => {
    if (!video) return
    window.dispatchEvent(new CustomEvent('pause-song'))
    return () => {
      window.dispatchEvent(new CustomEvent('resume-song'))
    }
  }, [video])

  if (!unlocked) return <Gate onUnlock={() => setUnlocked(true)} />

  return (
    <main>
      <ChapterNav eras={content.eras} active={activeChapter} />
      <AudioPlayer />
      <SecretsCounter onOpenVault={() => setVaultOpen(true)} />
      <Opening />
      {content.eras.map((era) => (
        <EraSection
          key={era.id}
          era={era}
          onActive={setActiveChapter}
          onOpenPolaroid={(e, index) => setLightbox({ polaroids: e.polaroids, index })}
          onPlayVideo={setVideo}
        />
      ))}
      <Finale />
      {/* vault renders before the lightbox so the lightbox stacks above it */}
      {vaultOpen && (
        <VaultOverlay
          suspended={lightbox !== null}
          onOpenPhoto={(index) => setLightbox({ polaroids: content.vault.photos, index })}
          onClose={() => setVaultOpen(false)}
        />
      )}
      {lightbox && (
        <Lightbox
          polaroids={lightbox.polaroids}
          index={lightbox.index}
          onNavigate={(index) => setLightbox({ polaroids: lightbox.polaroids, index })}
          onClose={() => setLightbox(null)}
        />
      )}
      {video && <VideoOverlay src={video} onClose={() => setVideo(null)} />}
    </main>
  )
}
