import style from './Img.css'
import classnames from 'classnames/bind'
import React, {Component} from 'react'
import PropTypes from 'prop-types'

const EMPTY_OBJECT = {}
const divStyle = {position: 'relative'}
const cx = classnames.bind(style)
// A map of "src" to {width, height, path} loaded images.
// New images overwrite old ones if w*h is larger than existing.
const loadedMap = {}

export default class Img extends Component {
  static contextTypes = {
    account: PropTypes.string,
  }

  static propTypes = {
    height: PropTypes.number.isRequired,
    src: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    account: PropTypes.string,
    relative: PropTypes.bool,
    alt: PropTypes.string,
    backgroundColor: PropTypes.string,
    className: PropTypes.string,
  }

  constructor(props) {
    super(props)
    const {src, relative, width = 1, height = 1} = this.props
    this.state = this.buildState(src, width, height, relative)
    this.handleLoad = this.handleLoad.bind(this)
    this.handleRef = this.handleRef.bind(this)
    this.getPath = this.getPath.bind(this)
    this.buildState = this.buildState.bind(this)
  }

  componentDidMount() {
    if (!this.state.loaded && this.img.complete) {
      this.handleLoad()
    }
  }

  componentWillReceiveProps({src, width, height}) {
    if (this.props.src !== src) {
      this.setState(this.buildState(src, width, height))
    }
  }

  buildState(src, width, height, relative) {
    const {height: loadedHeight = 0, width: loadedWidth = 0, path: loadedPath} =
      loadedMap[src] || EMPTY_OBJECT
    const bestPath =
      loadedHeight * loadedWidth > height * width
        ? loadedPath
        : this.getPath(src, width, height, relative)
    return {
      loaded: loadedPath === bestPath,
      loadedPath,
      bestPath,
    }
  }

  getBaseUrl(relative) {
    return relative ? '' : `//${this.context.account}.vteximg.com.br`
  }

  handleLoad() {
    const {src, relative, width = 1, height = 1} = this.props
    const {height: loadedHeight = 0, width: loadedWidth = 0} =
      loadedMap[src] || EMPTY_OBJECT
    const path = this.getPath(src, width, height, relative)
    // Only cache loaded image if dimensions are larger than existing ones.
    if (loadedHeight * loadedWidth < height * width) {
      loadedMap[src] = {
        width,
        height,
        path,
      }
    }
    if (this.state.loaded) {
      return
    }
    this.setState({
      loaded: true,
      loadedPath: path,
      bestPath: path,
    })
  }

  handleRef(img) {
    this.img = img
  }

  replaceWidthAndHeight(src, width, height) {
    return src.replace('#width#', width).replace('#height#', height)
  }

  getPath(src, width, height, relative) {
    if (src.indexOf('http') !== -1) {
      return src
    }
    return `${this.getBaseUrl(relative)}${this.replaceWidthAndHeight(
      src,
      width,
      height,
    )}`
  }

  render() {
    const {loaded, loadedPath, bestPath} = this.state
    const width = this.props.width || this.props.height
    const height = this.props.height || width
    const loading = cx(this.props.className, 'square', {
      'shimmer-loading': !loaded && !loadedPath,
    })
    const handleLoad = !loaded && this.handleLoad

    return (
      <div style={divStyle}>
        <div
          className={loading}
          style={{
            maxWidth: width,
            borderColor: 'transparent',
            backgroundClip: 'padding-box',
          }}
        />
        {!loaded &&
          loadedPath && (
            <img
              alt={this.props.alt}
              className={this.props.className}
              src={loadedPath}
              style={{
                top: '0',
                left: '0',
                right: '0',
                width,
                height,
                maxWidth: '100%',
                maxHeight: '100%',
                marginLeft: 'auto',
                marginRight: 'auto',
                position: 'absolute',
              }}
            />
          )}
        <img
          alt={this.props.alt}
          className={this.props.className}
          ref={this.handleRef}
          src={bestPath}
          style={{
            top: '0',
            left: '0',
            right: '0',
            maxWidth: '100%',
            maxHeight: '100%',
            marginLeft: 'auto',
            marginRight: 'auto',
            position: 'absolute',
          }}
          onLoad={handleLoad}
        />
      </div>
    )
  }
}
