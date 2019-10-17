import PropTypes from 'prop-types'
import { FormattedRelativeTime, injectIntl } from 'react-intl'
import React, { FC } from 'react'
import hoistNonReactStatics from 'hoist-non-react-statics'

function getDisplayName(Component: React.ComponentType<any>) {
  return Component.displayName || Component.name || 'Component'
}

// We do our best to maintain compatibility with the prvious API but this is not perfect
const getCorrectUnit = (timeDiff: number) => {
  const years = timeDiff / (millisecondsInDay * 365)
  if (isUnitValid(years)) {
    return {
      value: Math.round(years),
      unit: 'year',
    }
  }
  const months = timeDiff / (millisecondsInDay * 30)
  if (isUnitValid(months)) {
    return {
      value: Math.round(months),
      unit: 'month',
    }
  }

  const days = timeDiff / millisecondsInDay
  if (isUnitValid(days)) {
    return {
      value: Math.round(days),
      unit: 'day',
    }
  }
  const hours = timeDiff / millisecondsInHour
  if (isUnitValid(hours)) {
    return {
      value: Math.round(hours),
      unit: 'hour',
    }
  }
  const minutes = (timeDiff / 60) * 1000
  if (isUnitValid(minutes)) {
    return {
      value: Math.round(minutes),
      unit: 'minute',
    }
  }
  return {
    value: Math.round(timeDiff / 1000),
    unit: 'second',
  }
}

const FormattedRelative: FC<any> = props => {
  console.warn(
    'FormattedRelative was removed in react-intl@3.x, you are using an approximation. Plase start using FormattedRelativeTime.'
  )
  const { value } = props
  let timeDiff
  if (value instanceof Date) {
    timeDiff = value.getTime() - Date.now()
  }
  if (typeof value === 'string') {
    timeDiff = new Date(value).getTime() - Date.now()
  }
  if (!timeDiff) {
    return null
  }
  const { value: newValue, unit } = getCorrectUnit(timeDiff)
  return <FormattedRelativeTime value={newValue} unit={unit as any} />
}

const addLocaleData = () => {
  console.warn(
    'addLocaleData was removed in react-intl@3.x and is not needed anymore. Please read: https://github.com/formatjs/react-intl/blob/master/docs/Upgrade-Guide.md#formattedrelativetime'
  )
}

const millisecondsInHour = 60 * 60 * 1000
const millisecondsInDay = 24 * millisecondsInHour

const isUnitValid = (value: number) => Math.abs(value) >= 1

const renderFormatRelative = (intl: any) => (value: any) => {
  console.warn(
    'formatRelative was removed in react-intl@3.x, please start using formatRelativeTime.'
  )
  let timeDiff
  if (value instanceof Date) {
    timeDiff = value.getTime() - Date.now()
  }
  if (typeof value === 'string') {
    timeDiff = new Date(value).getTime() - Date.now()
  }
  if (!timeDiff) {
    return null
  }

  const { value: newValue, unit } = getCorrectUnit(timeDiff)

  return intl.formatRelativeTime(newValue, unit)
}

const renderRuntimeInjectIntl: FC<any> = (
  WrappedComponent: any,
  options?: any
) => {
  const intlPropName = (options && options.intlPropName) || 'intl'
  const forwardRef = (options && options.forwardRef) || false
  const WithRenderRuntimeIntl = injectIntl(props => {
    const intlObj = props[intlPropName] as any
    if (intlObj) {
      intlObj.formatRelative = renderFormatRelative(intlObj)
    }
    return (
      <WrappedComponent
        {...props}
        ref={forwardRef ? props.forwardedRef : null}
      />
    )
  }, options)

  WithRenderRuntimeIntl.displayName = `renderRuntimeInjectIntl(${getDisplayName(
    WrappedComponent
  )}`
  WithRenderRuntimeIntl.WrappedComponent = WrappedComponent

  if (forwardRef) {
    return hoistNonReactStatics(
      // eslint-disable-next-line react/display-name
      React.forwardRef((props, ref) => (
        <WithRenderRuntimeIntl {...(props as any)} forwardedRef={ref} />
      )),
      WrappedComponent
    ) as any
  }
  return hoistNonReactStatics(WithRenderRuntimeIntl, WrappedComponent) as any
}

export const createReactIntl = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { injectIntl, ...rest } = window.ReactIntl
  if (!window.ReactIntlLocaleData) {
    window.ReactIntlLocaleData = {}
  }

  return {
    ...rest,
    injectIntl: renderRuntimeInjectIntl,
    intlShape: PropTypes.any,
    FormattedRelative,
    addLocaleData,
  }
}
