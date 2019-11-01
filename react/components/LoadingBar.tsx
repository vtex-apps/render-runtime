import React from 'react'
import styles from './LoadingBar.css'

const LoadingBar = () => (
  <div
    className={`${styles.loadingBarAnimation} fixed top-0 left-0 right-0 z-max bg-action-primary`}
    style={{ height: 4 }}
  >
    <div
      style={{
        background:
          'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 80%, rgba(255, 255, 255, 0.5) 90%, rgba(255, 255, 255, 0.8))',
        width: '100%',
        height: '100%',
      }}
    />
  </div>
)

export default LoadingBar
