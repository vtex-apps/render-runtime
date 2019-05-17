import PropTypes from 'prop-types'
import * as R from 'ramda'
import React, { Component } from 'react'

import ExtensionPortal from './ExtensionPortal'

export interface PortalRenderingRequest {
  extensionName: string,
  destination: HTMLElement,
  props: any
}

interface Props {
  runtime: RenderRuntime,
}

interface State {
  extensionsToRender: PortalRenderingRequest[]
}

class ExtensionManager extends Component<Props, State> {

  public static propTypes = {
    runtime: PropTypes.object,
  }

  public constructor(props: Props) {
    super(props)
    this.state = {
      extensionsToRender: []
    }
  }

  public componentDidMount() {
    const { runtime: { emitter } } = this.props
    emitter.addListener('renderExtensionLoader.addOrUpdateExtension', this.updateExtensions)
  }

  public componentWillUnmount() {
    const { runtime: { emitter } } = this.props
    emitter.removeListener('renderExtensionLoader.addOrUpdateExtension', this.updateExtensions)
  }

  public updateExtensions = (extension: PortalRenderingRequest) => {
    this.setState({
      extensionsToRender: this.addOrUpdateExtension(this.state.extensionsToRender, extension)
    })
  }

  public render() {
    return this.state.extensionsToRender.map((el) => {
      return <ExtensionPortal key={el.extensionName} extension={el}/>
    })
  }

  private addOrUpdateExtension = (extensionsList: PortalRenderingRequest[], newExtension: PortalRenderingRequest): PortalRenderingRequest[] => {
    const exists = R.any((el: PortalRenderingRequest) => {
      return el.extensionName === newExtension.extensionName
    })(extensionsList)
    const newExtensionsList = exists ? R.map((el: PortalRenderingRequest) => {
      return el.extensionName === newExtension.extensionName ? newExtension : el
    }, extensionsList) : R.append(newExtension, extensionsList)
    return newExtensionsList
  }
}

export default ExtensionManager
