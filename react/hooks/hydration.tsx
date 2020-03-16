import { useRef } from 'react'

/** Gets HTML content from elements rendered on the server, before being
 * hydrated on the client (and whether they have been SSRendered at all). */
export const useDehydratedContent = (hydrationId: string) => {
  /** On both cases below, the use of useRef is to guarantee that only the values
   * that it has been initialized with is being considered, to guarantee that it's
   * only taking into account the HTML that's coming from the server, instead of
   * eventual elements that might be included later.
   */
  const dehydratedElement = useRef(
    window?.document?.querySelector?.(`[data-hydration-id="${hydrationId}"]`)
  )

  const hasDehydratedContent = useRef(
    !!dehydratedElement.current &&
      dehydratedElement.current.childElementCount > 0
  )

  return {
    hasRenderedOnServer: hasDehydratedContent.current,
    dehydratedElement: dehydratedElement.current,
  }
}
