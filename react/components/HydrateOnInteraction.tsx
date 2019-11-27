import React, { useEffect, useState, FC, useRef } from 'react'
import PreventHydration from './PreventHydration'

const HydrateOnInteraction: FC = ({ children, id }) => {
  const [shouldHydrate, setHydrate] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref.current) {
      return
    }
    const handleMouseOver = () => {
      setHydrate(true)
      ref.current.removeEventListener('mouseover', handleMouseOver)
    }
    ref.current.addEventListener('mouseover', handleMouseOver)
  }, [])

  return (
    <PreventHydration ref={ref} shouldHydrate={shouldHydrate} id={id}>
      <div className="ba b--red">{children}</div>
    </PreventHydration>
  )
}

export default HydrateOnInteraction
