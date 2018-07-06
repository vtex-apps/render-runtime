import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import {getComponentFromExtensions} from '../utils/assets'

interface Props {
  useDefault?: boolean
}

export default class Loading extends PureComponent<Props> {
  public render() {
    const LoadingExtension = getComponentFromExtensions('loading')
    console.log('render', LoadingExtension)
    return LoadingExtension && !this.props.useDefault ? <LoadingExtension /> : (
      <svg width="26px" height="26px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
        <circle cx="50" opacity="0.4" cy="50" fill="none" stroke="#F71963" strokeWidth="14" r="40"></circle>
        <circle cx="50" cy="50" fill="none" stroke="#F71963" strokeWidth="12" r="40" strokeDasharray="60 900" strokeLinecap="round" transform="rotate(96 50 50)">
          <animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;360 50 50" keyTimes="0;1" dur="0.7s" begin="0s" repeatCount="indefinite"></animateTransform>
        </circle>
      </svg>
    )
  }
}
