import ReactDOM from 'react-dom'
import React from 'react'
import { getImplementation } from '../../utils/assets'
import { isSiteEditorIframe } from '../../utils/dom'
import type { RenderContext } from '../RenderContext'
import type { Extension } from '../../typings/runtime'

interface Props {
  component: string | null
  props: Record<string, any>
  treePath: string
  runtime: RenderContext
  hydration: Extension['hydration']
}

class SiteEditorWrapper extends React.Component<Props> {
  public componentDidMount() {
    this.addDataToElementIfEditable()
  }

  public componentDidUpdate() {
    this.addDataToElementIfEditable()
  }

  public componentWillUnmount() {
    this.removeDataFromElement()
  }

  private addDataToElementIfEditable = () => {
    const {
      component,
      treePath,
      runtime: {
        extensions: { [treePath]: extension },
      },
    } = this.props

    const ComponentImpl = component && getImplementation(component)

    const isEditable =
      extension?.hasContentSchema ||
      ComponentImpl?.hasOwnProperty('schema') ||
      ComponentImpl?.hasOwnProperty('getSchema')

    if (!isEditable) {
      return
    }

    // eslint-disable-next-line react/no-find-dom-node
    const element = ReactDOM.findDOMNode(this) as Element

    if (element && element.setAttribute) {
      element.setAttribute('data-extension-point', treePath)
    }
  }

  private removeDataFromElement = () => {
    if (!isSiteEditorIframe) {
      return
    }
    // eslint-disable-next-line react/no-find-dom-node
    const element = ReactDOM.findDOMNode(this) as Element

    if (element && element.removeAttribute) {
      element.removeAttribute('data-extension-point')
    }
  }

  public render() {
    return <>{this.props.children}</>
  }
}

export default SiteEditorWrapper
