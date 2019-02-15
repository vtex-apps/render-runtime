import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {createPortal as reactCreatePortal} from 'react-dom'

import ExtensionPoint from './ExtensionPoint'

interface Props {
  extension: SimplifiedExtension,
}

class ExtensionPortal extends Component<Props> {

  public static propTypes = {
    extension: PropTypes.object,
  }

  constructor(props: Props) {
    super(props)
  }

  public render() {
    const { extension, element, props } = this.props.extension
    console.log('ESTOU NO PORTAL', this.props)
    return reactCreatePortal(<ExtensionPoint id={extension} {...props} />, element)
  }
}

export default ExtensionPortal

