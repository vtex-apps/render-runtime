import React, { useEffect, useState, FC, useRef } from 'react'
import PreventHydration from './PreventHydration'

const HydrateOnIntersection: FC = ({ children }) => {
  const [shouldHydrate, setHydrate] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref.current) {
      return
    }
    new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting) {
        return
      }

      setTimeout(() => {
        if (!ref.current) {
          return
        }
        if (!entry.isIntersecting) {
          return
        }
        observer.unobserve(ref.current)

        setHydrate(true)
      }, 100)
    }).observe(ref.current)
  }, [])

  return (
    <PreventHydration ref={ref} shouldHydrate={shouldHydrate}>
      {children}
    </PreventHydration>
  )
}

export default HydrateOnIntersection
