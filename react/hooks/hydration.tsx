import { useState } from 'react'

/** Gets HTML content from elements rendered on the server, before being
 * hydrated on the client (and whether they have been SSRendered at all). */
export const useDehydratedContent = (hydrationId: string) => {
  /** On both cases below, the use of useState is to guarantee that only the values
   * that it has been initialized with are being considered, to guarantee that it's
   * only taking into account the HTML that's coming from the server, instead of
   * eventual elements that might be inserted later.
   */
  const [dehydratedElement] = useState(() =>
    window?.document?.querySelector?.(`[data-hydration-id="${hydrationId}"]`)
  )

  const [hasDehydratedContent] = useState(
    !!dehydratedElement && dehydratedElement.childElementCount > 0
  )

  return {
    hasRenderedOnServer: !!dehydratedElement,
    hasDehydratedContent,
    dehydratedElement,
  }
}
