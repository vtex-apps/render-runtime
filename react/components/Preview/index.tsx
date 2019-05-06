import React, { ReactElement, RefObject } from 'react'
import ContentLoader, { IContentLoaderProps } from 'react-content-loader'

import Box from './Box'
import Circle from './Circle'
import Grid from './Grid'
import Text from './Text'

interface Props {
  extension: Extension
}
interface State {
  containerWidth?: number | null
}

interface PreviewGraphic {
  preserveAspectRatio: string
  svg: ReactElement<any> | null
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

  private getPreviewGraphic = (width: number, height: number, type: string): PreviewGraphic | null => {
    if (!type || type === 'none') {
      return null
    }

    switch (type) {
      case 'box':
      /** TODO: deprecate block in favor of box */
      case 'block':
        return {
          preserveAspectRatio: 'none',
          svg: <Box width={width} height={height} />,
        }
      case 'text': 
        return {
          preserveAspectRatio: 'none',
          svg: <Text width={width} height={height} />,
        }
      /** TODO: add support for Grid preview */
      case 'grid': 
        return {
          preserveAspectRatio: 'none',
          svg: <Grid width={width} height={height} />,
        }
      case 'circle':
        return {
          preserveAspectRatio: 'xMidYMid meet',
          svg: <Circle width={width} height={height} />,
        }
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

    const width = typeof initialWidth === 'number' ? Math.min(maxWidth, initialWidth) : maxWidth
    const height = initialHeight || 0

    const previewGraphic = this.getPreviewGraphic(width, height, type)

    return (
      /** TODO: remove this div in favor of the Container component,
       * currently on store-components
       * @author: lbebber
       */
      <div
        ref={this.container}
        className={fullWidth ? '' : 'ph3 ph5-m ph2-xl mw9 center'}>
        {previewGraphic ? (
          <ContentLoader
            width={width}
            height={height}

            /** TODO: get these colors from the store theme */
            primaryColor="#fafafa"
            secondaryColor="#efefef"
            preserveAspectRatio={previewGraphic.preserveAspectRatio as IContentLoaderProps['preserveAspectRatio']}
            style={{
              height,
              maxWidth: width,
              width: '100%'
            }}
          >
            {previewGraphic.svg}
          </ContentLoader>
        ) : (
          <div style={{ height, width }}/>
        )}
      </div>
    )
  }
}

