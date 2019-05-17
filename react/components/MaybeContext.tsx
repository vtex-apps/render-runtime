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
    const {context, props: pageProps} = runtime.extensions[nestedPage]
    const pageContextProps = pageProps && pageProps.context

    let contextComponent
    let props

    if (context) {
      contextComponent  = context.component
      props = {
        ...pageContextProps,
        nextTreePath: nestedPage,
        params,
        query,
        ...context.props
      }
    }

    return contextComponent
      ? <ExtensionPointComponent component={contextComponent} props={props} runtime={runtime} treePath={nestedPage}>{children}</ExtensionPointComponent>
      : children
  }
}
