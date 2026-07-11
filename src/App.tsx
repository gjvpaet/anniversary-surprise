import { useState } from 'react'
import { content } from './content'
import { isUnlocked } from './lib/gate'
import Gate from './components/Gate'
import Opening from './components/Opening'
import EraSection from './components/EraSection'
import ChapterNav from './components/ChapterNav'
import Finale from './components/Finale'

/**
 * Day-2 scroll world: opening overlook → six pinned era scenes with
 * scrub-driven camera flights → 9th island → letter finale. All
 * content still renders from content.ts; reduced-motion users get the
 * same page as a static vertical read.
 */
export default function App() {
  const [unlocked, setUnlocked] = useState(isUnlocked)
  const [activeChapter, setActiveChapter] = useState(0)

  if (!unlocked) return <Gate onUnlock={() => setUnlocked(true)} />

  return (
    <main>
      <ChapterNav eras={content.eras} active={activeChapter} />
      <Opening />
      {content.eras.map((era) => (
        <EraSection key={era.id} era={era} onActive={setActiveChapter} />
      ))}
      <Finale />
    </main>
  )
}
