import { useRef } from 'react'

export const useDehydratedContent = (hydrationId: string) => {
  const dehydratedElement = window?.document?.querySelector?.(
    `[data-hydration-id="${hydrationId}"]`
  )

  const hasDehydratedContent = useRef(
    !!dehydratedElement && dehydratedElement.childElementCount > 0
  )

  const hasRenderedOnServer =
    !!dehydratedElement && hasDehydratedContent.current

  return { hasRenderedOnServer, dehydratedElement }
}
