import React, { FunctionComponent } from 'react'

import { TreePathContextProvider } from '../../utils/treePath'
import { isSiteEditorIframe } from '../../utils/dom'
import SiteEditorWrapper from './SiteEditorWrapper'
import Hydration from '../Hydration'
import { LazyImages } from '../LazyImages'
import ComponentGetter from './ComponentGetter'

interface Props {
  component: string | null
  props: Record<string, any>
  treePath: string
  runtime: RenderContext
  hydration: Hydration
}

const ComponentLoader: FunctionComponent<Props> = (loaderProps) => {
  const { component, treePath, hydration } = loaderProps

  /**
   * Slot props should ALWAYS be PascalCased.
   * It is OK to not include componentProps in the dependency array
   * since there is currently no way for users to ADD or UPDATE slots via CMS.
   * What this means is that the slots variable below only needs to be
   * computed once during runtime, since we know that, even if componentProps
   * is updated, the props that function as Slots will NOT change.
   */

  if (component?.includes('Fold')) {
    return null
  }

  let content = <ComponentGetter {...loaderProps} />

  const shouldHydrate =
    !hydration ||
    hydration === 'always' ||
    /** TODO: Currently it only applies partial hydration on top level components
     * Nested partial hydration should be supported in the future */
    /** (using indexOf instead of regex for performance
     * https://jsperf.com/js-regex-match-vs-substring) */
    treePath?.substring(treePath?.indexOf('/') + 1).indexOf('/') > -1

  if (!isSiteEditorIframe && !shouldHydrate) {
    content = (
      <LazyImages>
        <Hydration treePath={treePath} hydration={hydration}>
          {content}
        </Hydration>
      </LazyImages>
    )
  }

  content = (
    <TreePathContextProvider treePath={treePath}>
      {content}
    </TreePathContextProvider>
  )

  if (isSiteEditorIframe) {
    content = <SiteEditorWrapper {...loaderProps}>{content}</SiteEditorWrapper>
  }

  return content
}

export default ComponentLoader
