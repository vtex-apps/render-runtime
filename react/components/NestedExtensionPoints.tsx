import {canUseDOM} from 'exenv'
import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'

import ExtensionPoint from '../ExtensionPoint'
import {getPagePath, getParams} from '../utils/pages'
import {RenderContext} from './RenderContext'

const EMPTY_OBJECT = {}

interface Props {
  page: string,
  query?: Record<string, string>,
}

export default class NestedExtensionPoints extends PureComponent<Props> {
  public static propTypes = {
    page: PropTypes.string.isRequired,
    query: PropTypes.object,
  }

  public getPageParams(runtime: RenderContext, name: string) {
    const path = canUseDOM ? window.location.pathname : global.__pathname__
    const pagePath = getPagePath(name, runtime.pages)
    const pagePathWithRest = pagePath && /\*\w+$/.test(pagePath) ? pagePath : pagePath.replace(/\/?$/, '*_rest')
    return pagePath && getParams(pagePathWithRest, path) || EMPTY_OBJECT
  }

  public render() {
    const {page, query} = this.props
    const segments = page.split('/')
    const reverse = segments.slice().reverse()
    // Nest extension points for nested pages
    // a/b/c should render three extension points
    // <a><b><c></c></b></a>
    const getNestedExtensionPoints = (runtime?: RenderContext) => {
      return reverse.reduce((acc: JSX.Element | null, value: string, index: number) => (
        <ExtensionPoint
          id={value}
          query={query}
          params={this.getPageParams(runtime!, segments.slice(0, segments.length - index).join('/'))}>
          {acc}
        </ExtensionPoint>
      ), null as JSX.Element | null)
    }

    return <RenderContext.Consumer>{getNestedExtensionPoints}</RenderContext.Consumer>
  }
}
