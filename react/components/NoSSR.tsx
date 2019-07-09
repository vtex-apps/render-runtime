import React, { useState, useEffect, FunctionComponent } from 'react'

const useSSR = () => {
  const [isCSRAvailable, setCSR] = useState(false)

  useEffect(() => {
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
