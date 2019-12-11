import React, { Fragment, FC, useState, useEffect } from 'react'

interface Props {
  intlPolyfillPromise: Promise<void> | null
}

const WaitIntlPolyfill: FC<Props> = ({ children, intlPolyfillPromise }) => {
  const locale = window?.__RUNTIME__?.culture?.locale
  const [lang] = locale ? locale.split('-') : ['']
  const hasPolyfilledPluralRules =
    lang &&
    window?.Intl?.PluralRules?.polyfilled &&
    window?.Intl?.PluralRules?.localeData?.[lang]
  const hasPolyfilledRelativeTmeRules =
    lang &&
    window?.Intl?.RelativeTimeFormat?.polyfilled &&
    window?.Intl?.RelativeTimeFormat?.localeData?.[lang]
  const arePolyfillsDone = Boolean(
    hasPolyfilledPluralRules && hasPolyfilledRelativeTmeRules
  )
  const [canRender, setCanRender] = useState(arePolyfillsDone)

  useEffect(() => {
    if (intlPolyfillPromise && !canRender) {
      intlPolyfillPromise.then(() => {
        setCanRender(true)
      })
    }
  }, [canRender, intlPolyfillPromise])

  if (!intlPolyfillPromise || canRender) {
    return <Fragment>{children}</Fragment>
  }

  return null
}

export default WaitIntlPolyfill
