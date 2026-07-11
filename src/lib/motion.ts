import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

if (import.meta.env.DEV) {
  // console access while developing
  ;(window as unknown as Record<string, unknown>).__gsap = gsap
  ;(window as unknown as Record<string, unknown>).__ScrollTrigger = ScrollTrigger
}

export { gsap, ScrollTrigger }
