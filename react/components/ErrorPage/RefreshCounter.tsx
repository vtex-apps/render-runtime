import React, { useEffect, useMemo, useState } from 'react'
import styles from './error-page.module.css'

const EXPIRATION_TIME = 10 * 60 * 1000 // 10 minutes in milliseconds

function RefreshCounter() {
  const [counter, setCounter] = useState<number>(10)

  const lastRefreshTime = useMemo(
    () => (localStorage.getItem('lastRefreshTime') || 0) as number,
    []
  )
  const currentTime = useMemo(() => new Date().getTime(), [])
  const shouldRefresh = useMemo(
    () => !lastRefreshTime || currentTime - lastRefreshTime > EXPIRATION_TIME,
    [currentTime, lastRefreshTime]
  )

  useEffect(() => {
    if (counter > 0) {
      const timer = setInterval(
        () => setCounter((prevCounter) => prevCounter - 1),
        1000
      )
      return () => clearInterval(timer)
    } else if (shouldRefresh) {
      localStorage.setItem(
        'lastRefreshTime',
        (currentTime as unknown) as string
      )

      window.location.reload()
    }
    return
  }, [counter, currentTime, shouldRefresh])

  if (!shouldRefresh) return null

  return (
    <div data-sl-text data-variant="caption1" className={styles.counter}>
      <div data-sl-spinner>
        <svg viewBox="0 0 50 50" width={16} height={16}>
          <circle cx={25} cy={25} r={20} />
        </svg>
      </div>
      Automatic retry in {counter}...
    </div>
  )
}

export default RefreshCounter
