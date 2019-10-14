import PropTypes from 'prop-types'
import { FormattedRelativeTime } from 'react-intl'
import React, { FC } from 'react'
import { selectUnit } from '@formatjs/intl-utils'

const FormattedRelative: FC<any> = props => {
  console.warn(
    'FormattedRelative was removed in react-intl@3.x, you are using an approximation. Plase start using FormattedRelativeTime.'
  )
  const { value, unit } = selectUnit(props.value)
  return <FormattedRelativeTime value={value} unit={unit} />
}

const addLocaleData = () => {
  console.warn(
    'addLocaleData was removed in react-intl@3.x and is not needed anymore. Please read: https://github.com/formatjs/react-intl/blob/master/docs/Upgrade-Guide.md#formattedrelativetime'
  )
}

export const appendDataToReactIntl = () => {
  // Prevent crashes when importing removed properties in react-intl@3.x
  window.ReactIntl.intlShape = PropTypes.any
  window.ReactIntl.FormattedRelative = FormattedRelative
  window.ReactIntlLocaleData = {}
  window.ReactIntl.addLocaleData = addLocaleData
}
