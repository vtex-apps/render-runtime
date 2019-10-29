import React, {
  useRef,
  useEffect,
  useState,
  MouseEventHandler,
  ReactNode,
} from 'react'

interface Props {
  shouldHydrate?: boolean
  onMouseEnter?: MouseEventHandler
  children: ReactNode
}

const PreventHydration = React.forwardRef<HTMLDivElement, Props>(
  ({ children, shouldHydrate, ...props }, ref) => {
    const didHydrate = useRef(shouldHydrate)
    const isSSR = !window.navigator
    const [transitioned, setTransitioned] = useState(false)

    useEffect(() => {
      if (!shouldHydrate) {
        return
      }
      didHydrate.current = true
      setTimeout(() => {
        setTransitioned(true)
      }, 600)
    }, [shouldHydrate])

    if (isSSR) {
      return <div>{children}</div>
    }

    return (
      <>
        {!transitioned && (
          <div
            {...props}
            ref={ref}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: '' }}
          />
        )}
        {(shouldHydrate || didHydrate.current) && (
          <div style={{ display: transitioned ? '' : 'none' }}>{children}</div>
        )}
      </>
    )
  }
)

PreventHydration.displayName = 'PreventHydration'

export default React.memo(PreventHydration)
