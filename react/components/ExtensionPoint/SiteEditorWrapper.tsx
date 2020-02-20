import ReactDOM from 'react-dom'
import React from 'react'
import { getImplementation } from '../../utils/assets'
import { isSiteEditorIframe } from '../../utils/dom'

class SiteEditorWrapper extends React.Component<any> {
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
    const ComponentImpl =
      this.props.component && getImplementation(this.props.component)

    const isEditable =
      ComponentImpl &&
      (ComponentImpl.hasOwnProperty('schema') ||
        ComponentImpl.hasOwnProperty('getSchema'))

    if (!isEditable) {
      return
    }

    // eslint-disable-next-line react/no-find-dom-node
    const element = ReactDOM.findDOMNode(this) as Element

    if (element && element.setAttribute) {
      element.setAttribute('data-extension-point', this.props.treePath)
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
