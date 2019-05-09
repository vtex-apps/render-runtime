import hoistNonReactStatics from 'hoist-non-react-statics'
import forEachObjIndexed from 'ramda/es/forEachObjIndexed'
import React from 'react'
import { injectIntl, IntlProvider } from 'react-intl'

const APP_SPACER = '::'

const removeScopeForApp = (appNameAtMajor: string) => (key: string) => {
  if (key.indexOf(appNameAtMajor) === -1) {
    return key
  }
  const [_, unScopedKey] = key.split(APP_SPACER)
  return unScopedKey
}

const ScopeMessagesComponent = (app: string, Component: any) => ({children, intl, ...props}: any) => {
  const { messages } = intl
  const [appName, version] = app.split('@')
  const [major] = version.split('.')
  const appNameAtMajor = `${appName}@${major}.x`
  const removeScope = removeScopeForApp(appNameAtMajor)
  forEachObjIndexed(
    (value, key, obj) => {
      const renamedKey = removeScope(key as string)
      obj[renamedKey] = value
    },
    messages
  )
  return (
    <IntlProvider messages={messages}>
      <Component {...props}>{children}</Component>
    </IntlProvider>
  )
}

export const scopeMessages = (app: string, Component: any) => hoistNonReactStatics(
  injectIntl(ScopeMessagesComponent(app, Component)),
  Component
)
