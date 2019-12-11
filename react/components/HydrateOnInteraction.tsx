import React, { useEffect, useState, FC, useRef } from 'react'
import PreventHydration from './PreventHydration'

interface Props {
  id: string
}

const HydrateOnInteraction: FC<Props> = ({ children, id }) => {
  const [shouldHydrate, setHydrate] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref.current) {
      return
    }
    const handleMouseOver = () => {
      setHydrate(true)
      if (ref.current) {
        ref.current.removeEventListener('mouseover', handleMouseOver)
      }
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
