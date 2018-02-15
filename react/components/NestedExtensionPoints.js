import {canUseDOM} from 'exenv'
import React, {PureComponent} from 'react'
import PropTypes from 'prop-types'

import ExtensionPoint from '../ExtensionPoint'
import {getParams} from '../utils/pages'

export default class NestedExtensionPoints extends PureComponent {
  static contextTypes = {
    pages: PropTypes.object,
  }

  static propTypes = {
    page: PropTypes.string.isRequired,
    query: PropTypes.object,
  }

  getPageParams(name) {
    const path = canUseDOM ? window.location.pathname : global.__pathname__
    const page = this.context.pages[name]
    return getParams(page.path, path)
  }

  render() {
    const {page, query} = this.props
    const segments = page.split('/')
    const reverse = segments.slice().reverse()
    // Nest extension points for nested pages
    // a/b/c should render three extension points
    // <a><b><c></c></b></a>
    const nestedExtensionPoints = reverse.reduce((acc, value, index) => (
      <ExtensionPoint
        id={value}
        query={query}
        params={this.getPageParams(segments.slice(0, segments.length - index).join('/'))}>
        {acc}
      </ExtensionPoint>
    ), null)

    return nestedExtensionPoints
  }
}
