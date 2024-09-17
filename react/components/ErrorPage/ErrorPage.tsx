import React from 'react'
import './shoreline.css'

import styles from './error-page.module.css'
import ErrorIcon from './ErrorIcon'
import RefreshCounter from './RefreshCounter'

export default function ErrorPage({ errorCode }: { errorCode?: string }) {
  const date = new Date()

  return (
    <div className={styles.layout}>
      <div className={styles.errorDetailsLayout}>
        <ErrorIcon />
        <div data-sl-text data-variant="display1" className={styles.title}>
          Something went wrong
        </div>
        <div data-sl-text data-variant="body" className={styles.description}>
          We {"couldn't"} connect to the server. If the problem persists, please
          contact VTEX support.
        </div>
        {errorCode ? (
          <div
            data-sl-text
            data-variant="caption2"
            className={styles.errorCode}
          >
            ID: {errorCode}
            <br />
            Date: {date.toUTCString()}
          </div>
        ) : null}
        <button
          data-sl-button
          data-variant="primary"
          data-size="normal"
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
        <RefreshCounter />
      </div>
    </div>
  )
}
