import React from 'react'
import './shoreline.css'

import styles from './error-page.module.css'
import ErrorIcon from './ErrorIcon'
import RefreshCounter from './RefreshCounter'
import { useIntl } from 'react-intl'

export default function ErrorPage({ errorCode }: { errorCode?: string }) {
  const { formatMessage, formatDate } = useIntl()
  const date = new Date()

  return (
    <div className={styles.layout}>
      <div className={styles.errorDetailsLayout}>
        <ErrorIcon />
        <div data-sl-text data-variant="display1" className={styles.title}>
          {formatMessage({ id: 'render-runtime.error.title' })}
        </div>
        <div data-sl-text data-variant="body" className={styles.description}>
          {formatMessage({ id: 'render-runtime.error.description' })}
        </div>
        {errorCode ? (
          <div
            data-sl-text
            data-variant="caption2"
            className={styles.errorCode}
          >
            {formatMessage({ id: 'render-runtime.error.error-id' })}:{' '}
            {errorCode}
            <br />
            {formatMessage({ id: 'render-runtime.error.error-date' })}:{' '}
            {formatDate(date, {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short',
            })}
          </div>
        ) : null}
        <button
          data-sl-button
          data-variant="primary"
          data-size="normal"
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          {formatMessage({ id: 'render-runtime.error.action.retry' })}
        </button>
        <RefreshCounter />
      </div>
    </div>
  )
}
