import {canUseDOM} from 'exenv'
import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'

import {getPageParams} from '../utils/pages'
import ExtensionPoint from './ExtensionPoint'

import Loading from './Loading'
import MaybeAuth from './MaybeAuth'
import MaybeContext from './MaybeContext'
import {RenderContext} from './RenderContext'

interface Props {
  loadingRoute: string | null,
  page: string,
  query?: Record<string, string>
}

// Returns `store` for `store/home` and `store/product`.
const commonRouteId = (a: string, b: string) => {
  if (a === b) {
    const parent = a.split('/').slice(0, -1).join('/')
    return parent === '' ? null : parent
  }
  let i = 0
  while(i < a.length && a.charAt(i) === b.charAt(i)) {
    i++
  }
  return a.substring(0, i).split('/').filter(Boolean).join('/')
}

export default class NestedExtensionPoints extends PureComponent<Props> {
  public static propTypes = {
    loadingRoute: PropTypes.string,
    page: PropTypes.string.isRequired,
    query: PropTypes.object,
  }

  public render() {
    const {loadingRoute, page, query} = this.props
    const segments = page.split('/')
    const reverse = segments.slice().reverse()
    const loadingCommon = loadingRoute && commonRouteId(page, loadingRoute)

    // Nest extension points for nested pages
    // a/b/c should render three extension points
    // <a><b><c></c></b></a>
    const getNestedExtensionPoints = (runtime: RenderContext) => {
      return reverse.reduce((acc: JSX.Element | null, value: string, index: number) => {
        const nestedPage = segments.slice(0, segments.length - index).join('/')
        const params = this.getNestedPageParams(runtime, nestedPage)

        if (loadingCommon) {
          if (loadingCommon.indexOf(nestedPage) === -1) {
            return null
          }
          if (nestedPage === loadingCommon) {
            acc = <Loading />
          }
        }

        return (
          <MaybeAuth pages={runtime.pages} page={nestedPage} navigate={runtime.navigate} render={
            (parentProps: any) => (
              <MaybeContext nestedPage={nestedPage} query={query} params={params} runtime={runtime}>
                <ExtensionPoint
                  id={value}
                  query={query}
                  params={params}
                  {...parentProps}>
                  {acc}
                </ExtensionPoint>
              </MaybeContext>
            )
          }/>
        )
      }, null as JSX.Element | null)
    }

    return <RenderContext.Consumer>{getNestedExtensionPoints}</RenderContext.Consumer>
  }

  private getNestedPageParams(runtime: RenderContext, name: string) {
    const {route: {id, params}} = runtime
    const path = canUseDOM ? window.location.pathname : window.__pathname__

    return id === name ? params : getPageParams(name, path, runtime.pages)
  }
}
