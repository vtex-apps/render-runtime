import React, { FunctionComponent, Fragment, useEffect, useState } from 'react'
import Loading from './Loading'
import { useRuntime } from './RenderContext'

const Session: FunctionComponent = ({ children }) => {
  const [ensured, setEnsured] = useState(false)
  const [error, setError] = useState(null)
  const { ensureSession } = useRuntime()

  useEffect(() => {
    let isCurrent = true
    if (ensured || error) {
      return
    }

    ensureSession()
      .then(() => {
        if (isCurrent) {
          setEnsured(true)
        }
      })
      .catch((err: any) => {
        if (isCurrent) {
          setError(err)
        }
      })

    return () => {
      isCurrent = false
    }
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
