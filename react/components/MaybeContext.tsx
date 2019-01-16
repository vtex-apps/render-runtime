import React, {PureComponent} from 'react'
import ExtensionPointComponent from '../components/ExtensionPointComponent'
import { RenderContextProps } from './RenderContext'

interface Props {
  nestedPage: string
  params?: any
  query?: any
}

export default class MaybeContext extends PureComponent<Props & RenderContextProps> {
  public render() {
    const {children, runtime, nestedPage, query, params} = this.props
    const context = runtime.extensions[`${nestedPage}/__context`]

    const props = context && {
      nextTreePath: nestedPage,
      params,
      query,
      ...context.props,
    }

    return context
      ? <ExtensionPointComponent component={context.component} props={props} runtime={runtime} treePath={nestedPage}>{children}</ExtensionPointComponent>
      : children
  }
}
