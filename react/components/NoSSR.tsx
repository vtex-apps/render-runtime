import React, { useState, useEffect, useLayoutEffect, FunctionComponent } from 'react'

const useEnhancedEffect =
  typeof window !== 'undefined'
    ? useLayoutEffect
    : useEffect

const useSSR = () => {
  const [isCSRAvailable, setCSR] = useState(false)

  useEnhancedEffect(() => {
    setCSR(true)
  }, [])

  return !isCSRAvailable
}

interface Props {
  onSSR?: React.ReactNode
}

const NoSSR: FunctionComponent<Props> = ({ children, onSSR }) => {
  const isSSR = useSSR()

  return <>{isSSR ? onSSR : children}</>
}

export default NoSSR

export { useSSR }
