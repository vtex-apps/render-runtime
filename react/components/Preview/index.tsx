import React, { ReactElement, RefObject } from 'react'

import Box from './Box'
import Circle from './Circle'
import Grid from './Grid'
import Spinner from './Spinner'
import Text from './Text'

interface Props {
  extension: Extension
}
interface State {
  containerWidth?: number | null
}

export default class Preview extends React.PureComponent<
  Props,
  State
> {
  private container: RefObject<HTMLDivElement>

  constructor(props: Props) {
    super(props)

    this.container = React.createRef()
    this.state = {
      containerWidth: null,
    }
  }

  private renderPreviewGraphic = (width: number, height: number, type: string): ReactElement<any> | null => {
    if (!type || type === 'none') {
      return null
    }

    switch (type) {
      case 'box':
      /** TODO: deprecate block in favor of box */
      case 'block':
        return <Box width={width} height={height} />
      case 'text': 
        return <Text width={width} height={height} />
      /** TODO: add support for Grid preview */
      case 'grid': 
        return <Grid width={width} height={height} />
      case 'circle':
        return <Circle width={width} height={height} />
      case 'spinner':
        return <Spinner width={width} height={height} />
      case 'transparent':
        return <div style={{ width, height }} />
      default:
        return null
    }
  }

  componentDidMount() { // tslint:disable-line member-access member-ordering
    /** Fixes a bug on react-content-loader related to limiting
     * the width of the component
     */
    const containerElement = this.container.current
    if (!containerElement) {
      return
    }

    this.setState({
      containerWidth: containerElement.offsetWidth,
    })
  }

  private getDimension = (dimension: PreviewDimension) => {
    if (typeof dimension === 'number') {
      return dimension
    }

    if (!dimension) {
      return null
    }

    const { extension } = this.props

    // TODO: support mobile
    const dimensionObject = dimension.desktop
    if (!dimensionObject) {
      return null
    }

    const { defaultValue } = dimensionObject

    const valueFromProp = dimensionObject.fromProp && extension.props[dimensionObject.fromProp]

    if (typeof valueFromProp === 'number') {
      return valueFromProp
    }

    return defaultValue
  }

  private getDimensions = () => {
    const { extension } = this.props

    if (!extension.preview) {
      return { width: null, height: null }
    }

    const { width, height } = extension.preview

    return {
      height: this.getDimension(height),
      width: this.getDimension(width),
    }
  }

  render() { // tslint:disable-line member-access member-ordering
    const { extension } = this.props

    if (!extension.preview) {
      return null
    }

    const {
      type,
      fullWidth,
    } = extension.preview

    const {
      width: initialWidth,
      height: initialHeight,
    } = this.getDimensions()

    const { containerWidth } = this.state

    const maxWidth = containerWidth || (window && window.innerWidth) || initialWidth || 0

    const padding = 5
    const width = (typeof initialWidth === 'number' ? Math.min(maxWidth, initialWidth) : maxWidth) - padding * 2
    const height = initialHeight ? initialHeight - padding * 2 : 0

    return (
      /** TODO: remove this div in favor of the Container component,
       * currently on store-components
       * @author: lbebber
       */
      <div
        ref={this.container}
        className={fullWidth ? '' : 'mw9 center'}
        style={{ padding }}>
        {this.renderPreviewGraphic(width, height, type)}
      </div>
    )
  }
}

