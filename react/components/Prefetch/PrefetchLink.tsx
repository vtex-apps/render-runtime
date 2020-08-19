import React, { FunctionComponent, useRef } from 'react'
import { usePrefetchAttempt } from '../../hooks/prefetch'
import { NavigateOptions } from '../../utils/pages'

interface Props {
  waitToPrefetch?: number
  onMouseOver?: (event: React.MouseEvent) => void
  onFocus?: (event: React.FocusEvent) => void
  href: string
  page?: string
  options: NavigateOptions
}

const PrefetchLink: FunctionComponent<Props> = ({
  waitToPrefetch,
  children,
  onFocus,
  onMouseOver,
  options,
  page,
  ...linkElementProps
}) => {
  const { href } = linkElementProps
  const ref = useRef<HTMLAnchorElement | null>(null)

  const executePrefetch = usePrefetchAttempt({
    ref,
    page,
    href,
    options,
    waitToPrefetch,
  })

  return (
    <a
      ref={ref}
      {...linkElementProps}
      onMouseOver={(event) => {
        onMouseOver && onMouseOver(event)
        executePrefetch()
      }}
      onFocus={(event) => {
        onFocus && onFocus(event)
        executePrefetch()
      }}
    >
      {children}
    </a>
  )
}

export default PrefetchLink
