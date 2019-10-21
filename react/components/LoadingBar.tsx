import React from 'react'
import styles from './LoadingBar.css'

const LoadingBar = () => (
  <div
    className={`${styles.loadingBarAnimation} fixed top-0 left-0 right-0 z-max bg-action-primary`}
    style={{ height: 4 }}
  />
)

export default LoadingBar
