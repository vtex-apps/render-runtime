import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {createPortal as reactCreatePortal} from 'react-dom'

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
    return reactCreatePortal(<ExtensionPoint id={extensionName} {...props} />, destination)
  }
}

export default ExtensionPortal

