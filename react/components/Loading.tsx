import React, {PureComponent} from 'react'
import {getExtensionImplementation} from '../utils/assets'
import {RenderContextProps, withRuntimeContext} from './RenderContext'

interface Props {
  useDefault?: boolean
}

const defaultLoading = (
  <svg width="26px" height="26px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
    <circle cx="50" opacity="0.4" cy="50" fill="none" stroke="#F71963" strokeWidth="14" r="40"></circle>
    <circle cx="50" cy="50" fill="none" stroke="#F71963" strokeWidth="12" r="40" strokeDasharray="60 900" strokeLinecap="round" transform="rotate(96 50 50)">
      <animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;360 50 50" keyTimes="0;1" dur="0.7s" begin="0s" repeatCount="indefinite"></animateTransform>
    </circle>
  </svg>
)

class Loading extends PureComponent<Props & RenderContextProps> {

  public render() {
    const {useDefault, runtime: {extensions, page}} = this.props
    const [root] = page.split('/')
    const LoadingExtension = getExtensionImplementation(extensions, `${root}/__loading`)

    return LoadingExtension && !useDefault ? <LoadingExtension /> : defaultLoading
  }
}

export default withRuntimeContext(Loading)
