import { useState } from 'react'
import { content } from './content'
import type { Era } from './content'
import { isUnlocked } from './lib/gate'
import Gate from './components/Gate'
import Opening from './components/Opening'
import EraSection from './components/EraSection'
import ChapterNav from './components/ChapterNav'
import AudioPlayer from './components/AudioPlayer'
import Lightbox from './components/Lightbox'
import Finale from './components/Finale'

/**
 * The scroll world: opening overlook → six pinned era scenes →
 * 9th island → polaroid-swirl letter finale. Day 3 adds the
 * lightbox (tap any polaroid) and the persistent song control.
 */
export default function App() {
  const [unlocked, setUnlocked] = useState(isUnlocked)
  const [activeChapter, setActiveChapter] = useState(0)
  const [lightbox, setLightbox] = useState<{ era: Era; index: number } | null>(null)

  if (!unlocked) return <Gate onUnlock={() => setUnlocked(true)} />

  return (
    <main>
      <ChapterNav eras={content.eras} active={activeChapter} />
      <AudioPlayer />
      <Opening />
      {content.eras.map((era) => (
        <EraSection
          key={era.id}
          era={era}
          onActive={setActiveChapter}
          onOpenPolaroid={(e, index) => setLightbox({ era: e, index })}
        />
      ))}
      <Finale />
      {lightbox && (
        <Lightbox
          polaroids={lightbox.era.polaroids}
          index={lightbox.index}
          onNavigate={(index) => setLightbox({ era: lightbox.era, index })}
          onClose={() => setLightbox(null)}
        />
      )}
    </main>
  )
}
