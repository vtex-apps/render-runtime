import React, { PureComponent } from 'react'
import ExtensionPoint from './ExtensionPoint'
import MaybeAuth from './MaybeAuth'
import MaybeContext from './MaybeContext'
import { RenderContext } from './RenderContext'

interface Props {
  page: string,
  query?: Record<string, string>
}

export default class RenderPage extends PureComponent<Props> {
  public render() {
    return (
      <RenderContext.Consumer>
      {
        runtime => {
          const {route: {params}} = runtime
          const {page, query} = this.props
          return (
            <MaybeContext nestedPage={page} query={query} params={params} runtime={runtime}>
              <ExtensionPoint
                id={page}
                query={query}
                params={params}
                {...this.props}
              />
            </MaybeContext>
          )
        }
      }
      </RenderContext.Consumer>
    )
  }
}
