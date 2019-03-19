import React, { RefObject } from 'react'
import ContentLoader from 'react-content-loader'

import Box from './Box'
import Circle from './Circle'
import Grid from './Grid'
import Text from './Text'

export interface Props {
  type: string
  width: number
  height: number
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

  private renderPreviewGraphic = ({ width, height, type }: { width: number, height: number, type: string }): React.ReactNode => {
    if (!type || type === 'none') {
      return
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
      default:
        return
    }
  }

  private getPreserveAspectRatio = () => (
    this.props.type === 'circle' ? 'xMidYMid meet' : 'none'
  )

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

  render() { // tslint:disable-line member-access member-ordering
    const { width: initialWidth, height, type } = this.props
    const { containerWidth } = this.state

    const maxWidth = containerWidth || (window && window.innerWidth) || initialWidth || 0
    const width = initialWidth ? Math.min(maxWidth, initialWidth) : maxWidth

    return (
      /** TODO: remove this div in favor of the Container component,
       * currently on store-components
       * @author: lbebber
       */
      <div
        ref={this.container}
        className="ph3 ph5-m ph8-l ph9-xl mw9 center">
        <ContentLoader
          width={width}
          height={height}
          /** TODO: get these colors from the store theme */
          primaryColor="#fafafa"
          secondaryColor="#f3f3f3"
          preserveAspectRatio={this.getPreserveAspectRatio()}
          style={{
            height,
            maxWidth: width,
            width: '100%'
          }}
        >
          {this.renderPreviewGraphic({ width, height, type })}
        </ContentLoader>
      </div>
    )
  }
}

