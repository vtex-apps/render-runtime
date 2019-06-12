import React, { FunctionComponent, Fragment, useEffect, useRef, useState } from 'react'
import Loading from './Loading'
import { useRuntime } from './RenderContext'

function useSafeState(initialState: any) {
  const [state, setState] = useState(initialState)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const safeSetState = (value: any) => {
    mountedRef.current && setState(value)
  }

  return [state, safeSetState]
}

const Session: FunctionComponent = ({ children }) => {
  const [ensured, setEnsured] = useSafeState(false)
  const [error, setError] = useSafeState(null)
  const { ensureSession } = useRuntime()

  useEffect(() => {
    if (ensured || error) {
      return
    }

    ensureSession()
      .then(() => {
        setEnsured(true)
      })
      .catch((err: any) => {
        setError(err)
      })
  }, [ensureSession, ensured, error])

  if (ensured) {
    return (
      <Fragment>
        {children}
      </Fragment>
    )
  }

  if (error) {
    return (
      <div className="bg-washed-red pa6 f5 serious-black br3 pre">
        <span>Error initializing session</span>
        <pre>
          <code className="f6">{error}</code>
        </pre>
      </div>
    )
  }

  return <Loading />
}

export default Session
