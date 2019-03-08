import PropTypes from 'prop-types'
import React, { Component, ReactPortal } from 'react'
import { createPortal } from 'react-dom'

import { PortalRenderingRequest } from './ExtensionManager'
import ExtensionPoint from './ExtensionPoint'

interface Props {
  extension: PortalRenderingRequest,
}

class ExtensionPortal extends Component<Props> {

  public static propTypes = {
    extension: PropTypes.object,
  }

  constructor(props: Props) {
    super(props)
  }

  public render() {
    const { extensionName, destination, props } = this.props.extension
    return createPortal(<ExtensionPoint id={extensionName} {...props} />, destination) as ReactPortal
  }
}

export default ExtensionPortal

