import React, { ReactElement, RefObject } from 'react'

import Box from './Box'
import Circle from './Circle'
import Grid from './Grid'
import Spinner from './Spinner'
import Text from './Text'
import { Extension, PreviewDimension } from '../../typings/runtime'

interface Props {
  extension: Extension
}
interface State {
  containerWidth?: number | null
}

export const TEST_ID = 'loading-preview'

export default class Preview extends React.PureComponent<Props, State> {
  private container: RefObject<HTMLDivElement>

  public constructor(props: Props) {
    super(props)

    this.container = React.createRef()
    this.state = {
      containerWidth: null,
    }
  }

  private renderPreviewGraphic = (
    width: number | string,
    height: number | string,
    type: string,
    options: any = {}
  ): ReactElement<any> | null => {
    if (!type || type === 'none') {
      return null
    }

    switch (type) {
      case 'box':
      /** TODO: deprecate block in favor of box */
      // eslint-disable-next-line no-fallthrough
      case 'block':
        return <Box width={width} height={height} />
      case 'text':
        return (
          <Text
            width={width}
            height={height}
            fontSize={options.fontSize}
            lineHeight={options.lineHeight}
          />
        )
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

  public componentDidMount() {
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

    const valueFromProp =
      dimensionObject.fromProp && extension.props[dimensionObject.fromProp]

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

  public render() {
    const { extension } = this.props

    if (!extension.preview) {
      return null
    }

    const { type, options = {}, fullWidth } = extension.preview

    const { width: initialWidth, height: initialHeight } = this.getDimensions()

    const { containerWidth } = this.state

    const maxWidth =
      containerWidth || (window && window.innerWidth) || initialWidth || 0

    const padding = options.padding == null ? 20 : options.padding
    const width = Math.max(
      (typeof initialWidth === 'number'
        ? Math.min(maxWidth, initialWidth)
        : maxWidth) -
        padding * 2,
      0
    )
    const height =
      initialHeight && initialHeight > padding * 2
        ? initialHeight - padding * 2
        : 0

    if (height === 0) {
      return null
    }

    return (
      /** TODO: remove this div in favor of the Container component,
       * currently on store-components
       * @author: lbebber
       */
      <div
        ref={this.container}
        className={fullWidth ? '' : 'mw9 center w-100'}
        data-testid={TEST_ID}
        style={{ padding }}
      >
        {this.renderPreviewGraphic(width || '100%', height, type, options)}
      </div>
    )
  }
}
