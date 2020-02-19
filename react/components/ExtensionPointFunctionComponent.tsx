import React, { useEffect, useState } from 'react'
import { getImplementation } from '../utils/assets'
import GenericPreview from './Preview/GenericPreview'
import Loading from './Loading'
import { TreePathContextProvider } from '../utils/treePath'

const componentPromiseMap: any = {}
const componentPromiseResolvedMap: any = {}

async function fetchComponent(
  component: string,
  fetchComponent: RenderContext['fetchComponent']
) {
  const Component = component && getImplementation(component)

  if (Component) {
    return Component
  }

  if (!(component in componentPromiseMap)) {
    componentPromiseMap[component] = fetchComponent(component)
  } else if (componentPromiseResolvedMap[component]) {
    /* Loading was completed but the component was not registered.
     * This means something wrong happened */
    throw new Error(`Unable to fetch component ${component}`)
  }

  await componentPromiseMap[component]

  componentPromiseResolvedMap[component] = true

  return getImplementation(component)
}

const ExtensionPointFunctionComponent = (props: any) => {
  const { component, children, treePath, props: componentProps } = props
  const Component = component && getImplementation(component)

  return (
    <TreePathContextProvider treePath={treePath}>
      {Component ? (
        <Component {...componentProps}>{children}</Component>
      ) : (
        <LazyLoadedExtensionPointComponent {...props}>
          {children}
        </LazyLoadedExtensionPointComponent>
      )}
    </TreePathContextProvider>
  )
}

const LazyLoadedExtensionPointComponent = (props: any) => {
  const {
    component,
    children,
    treePath,
    props: componentProps,
    runtime,
  } = props

  const isRootTreePath = treePath.indexOf('/') === -1
  const isAround = treePath.indexOf('$around') !== -1

  const [Component, setComponent] = useState(
    () => (component && getImplementation(component)) || null
  )

  useEffect(() => {
    if (Component) {
      return
    }

    fetchComponent(component, runtime.fetchComponent).then(result => {
      if (Component) {
        return
      }
      setComponent(() => result)
    })
  }, [Component, component, runtime.fetchComponent])

  return Component ? (
    <Component {...componentProps}>{children}</Component>
  ) : isRootTreePath || isAround ? (
    /* Adds header/footer before and after the preview during loading,
     * if the component being loaded is a root component--e.g. context
     * wrappers, `around` wrappers */
    <>
      {componentProps.beforeElements}
      <GenericPreview />
      {componentProps.afterElements}
    </>
  ) : (
    <Loading />
  )
}

export default ExtensionPointFunctionComponent
