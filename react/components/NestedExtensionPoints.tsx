import {canUseDOM} from 'exenv'
import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import MaybeAuth from './MaybeAuth'

import ExtensionPoint from '../ExtensionPoint'
import {getPagePath, getParams} from '../utils/pages'
import MaybeContext from './MaybeContext'
import {RenderContext} from './RenderContext'

const EMPTY_OBJECT = {}

interface Props {
  page: string,
  query?: Record<string, string>
}

export default class NestedExtensionPoints extends PureComponent<Props> {
  public static propTypes = {
    page: PropTypes.string.isRequired,
    query: PropTypes.object,
  }

  public getPageParams(runtime: RenderContext, name: string) {
    const path = canUseDOM ? window.location.pathname : window.__pathname__
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
    const getNestedExtensionPoints = (runtime: RenderContext) => {
      return reverse.reduce((acc: JSX.Element | null, value: string, index: number) => {
        const nestedPage = segments.slice(0, segments.length - index).join('/')
        const params = this.getPageParams(runtime, nestedPage)

        return (
          <MaybeAuth pages={runtime.pages} page={nestedPage} navigate={runtime.navigate}>
            <MaybeContext nestedPage={nestedPage} query={query} params={params} runtime={runtime}>
              <ExtensionPoint
                id={value}
                query={query}
                params={params}>
                {acc}
              </ExtensionPoint>
            </MaybeContext>
          </MaybeAuth>
        )
      }, null as JSX.Element | null)
    }

    return <RenderContext.Consumer>{getNestedExtensionPoints}</RenderContext.Consumer>
  }
}
