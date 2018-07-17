
import React, {PureComponent} from 'react'
import {getImplementation} from '../utils/assets'

interface Props {
  nestedPage: string
  extensions: Extensions
  params?: any
  query?: any
}

export default class MaybeContext extends PureComponent<Props> {
  public render() {
    const {children, extensions, nestedPage, query, params} = this.props
    const extension = extensions[`${nestedPage}/__context`]
    const ContextProvider = extension ? getImplementation<any>(extension.component) : null

    return ContextProvider
      ? <ContextProvider query={query} params={params}>{children}</ContextProvider>
      : children
  }
}
