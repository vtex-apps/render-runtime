import React, { ReactElement, FC } from 'react'
import { WrappedComponent } from './ComponentLoader'
import { useTreePath, useRuntime } from '../core/main'

interface VirtualComponent {
  $component: string
  props?: Record<string, unknown>
  children?: VirtualComponent[]
}

interface Props {
  virtual: VirtualComponent
}

interface ThoseProps {
  runtime: any
  treePath: string
  hydration: Hydration
  virtual: VirtualComponent
  key?: string
}

function renderVirtualComponent({
  hydration,
  runtime,
  treePath,
  virtual,
  key = treePath,
}: ThoseProps): ReactElement<unknown> | null {
  if (virtual.$component == null) {
    return null
  }

  return (
    <WrappedComponent
      component={virtual.$component}
      componentProps={virtual.props}
      treePath={treePath}
      hydration={hydration}
      runtime={runtime}
      key={key}
    >
      {virtual.children?.map((virtualChild, i) => {
        return renderVirtualComponent({
          hydration,
          runtime,
          treePath,
          key: `${treePath}-${virtualChild.$component}-${i}`,
          virtual: virtualChild,
        })
      })}
    </WrappedComponent>
  )
}

const VirtualComponent: FC<Props> = ({ virtual }) => {
  const { treePath } = useTreePath()
  const runtime = useRuntime()

  const extension = runtime.extensions[treePath]
  if (extension == null) {
    console.error(`Extension not found: "${treePath}"`)
    return null
  }

  const { hydration = 'always' } = extension

  return renderVirtualComponent({
    hydration,
    runtime,
    treePath,
    virtual,
  })
}

export default VirtualComponent
