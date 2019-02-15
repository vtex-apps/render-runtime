import PropTypes from 'prop-types'
import * as R from 'ramda'
import React, { Component } from 'react'

import ExtensionPortal from './ExtensionPortal'

interface Props {
  runtime: RenderRuntime,
}

interface State {
  extensions: SimplifiedExtension[]
}

const addOrUpdate = (extensions: SimplifiedExtension[], extension: SimplifiedExtension): SimplifiedExtension[] => {
  const exists = R.reduce((acc, el: SimplifiedExtension) => {
    return acc || el.extension === extension.extension
  }, false, extensions)
  const newExtensions = exists ? R.map((el: SimplifiedExtension) => el.extension === extension.extension ? extension : el, extensions) : R.append(extension, extensions)
  return newExtensions
}

class ExtensionManager extends Component<Props, State> {

  public static propTypes = {
    runtime: PropTypes.object,
  }

  constructor(props: Props) {
    super(props)
    this.state = {
      extensions: []
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

  public updateExtensions = (extension: SimplifiedExtension) => {
    console.log('------------ Event ------------')
    console.log(extension)
    console.log('-------------------------------')
    this.setState({
      extensions: addOrUpdate(this.state.extensions, extension)
    })
  }

  public render() {
    return this.state.extensions.map((el) => {
      return <ExtensionPortal key={el.extension} extension={el}/>
    })
  }
}

export default ExtensionManager

