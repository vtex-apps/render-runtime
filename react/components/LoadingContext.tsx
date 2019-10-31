import React, {
  useContext,
  useCallback,
  useMemo,
  useRef,
  ComponentType,
  FunctionComponent,
  useEffect,
} from 'react'

import GenericPreview from './Preview/GenericPreview'

interface LoadingContext {
  setLoading: (treePath: string, isLoading: boolean) => void
  isParentLoading?: boolean
}

const LoadingContext = React.createContext<LoadingContext>({
  setLoading: () => {},
  isParentLoading: false,
})

LoadingContext.displayName = 'LoadingContext'

const LoadingContextProvider = LoadingContext.Provider

interface LoadingState {
  components: { [key: string]: boolean }
}

const displayContent = (
  contentRef: React.RefObject<HTMLElement>,
  loaderRef: React.RefObject<HTMLElement>
) => {
  if (contentRef.current) {
    contentRef.current.style.position = ''
    contentRef.current.style.width = ''
    contentRef.current.style.opacity = ''
  }
  if (loaderRef.current) {
    loaderRef.current.style.display = 'none'
  }
}

const displayLoader = (
  contentRef: React.RefObject<HTMLElement>,
  loaderRef: React.RefObject<HTMLElement>
) => {
  if (contentRef.current) {
    contentRef.current.style.position = 'absolute'
    contentRef.current.style.width = '100%'
    contentRef.current.style.opacity = '0'
  }
  if (loaderRef.current) {
    loaderRef.current.style.display = ''
  }
}

/** TODO: LoadingWrapper is in the end a makeshift Suspense.
 * Should probably be replaced in the future. */
const LoadingWrapper: FunctionComponent = ({ children }) => {
  /* Uses Ref instead of state to prevent rerenders */
  const state = useRef<LoadingState>({ components: {} })

  /* A parent component can include a LoadingContext to tell its
   * children that it is loading data. */
  const { isParentLoading } = useContext(LoadingContext)

  const contentContainer = useRef<HTMLDivElement>(null)
  const loaderContainer = useRef<HTMLDivElement>(null)

  const loadingTimeout = useRef<NodeJS.Timer | null>(null)
  const loadingComplete = useRef(false)

  const updateLoading = useCallback(() => {
    const areComponentsLoading = Object.values(state.current.components).some(
      Boolean
    )

    const isLoading = isParentLoading || areComponentsLoading

    if (!isLoading) {
      loadingTimeout.current = setTimeout(() => {
        displayContent(contentContainer, loaderContainer)

        loadingComplete.current = true
      }, 500)
    } else {
      if (!loadingComplete.current && loadingTimeout.current !== null) {
        clearTimeout(loadingTimeout.current)
        loadingTimeout.current = null
      }

      if (isParentLoading && loadingComplete.current) {
        loadingComplete.current = false
        displayLoader(contentContainer, loaderContainer)
      }
    }
  }, [isParentLoading])

  const setLoading = useCallback(
    (treePath, loading) => {
      if (loadingComplete.current) {
        return
      }

      state.current.components[treePath] = loading

      updateLoading()
    },
    [updateLoading]
  )

  useEffect(() => {
    updateLoading()
  }, [isParentLoading, updateLoading])

  const value = useMemo(
    () => ({
      setLoading,
    }),
    [setLoading]
  )

  const isSSR = !window.navigator

  const returnValue = useMemo(
    () => (
      /** Renders both the content and the loader, and hides them via changing the
       * style via their refs. This is done for two reasons:
       * 1: to make the content execute its code while it is loading, because the
       * content can in turn require more components to be loaded, thus keeping
       * the loading state for longer.
       * 2: To prevent re-rendering when the loading state changes, which seemed
       * to cause some bugs. */
      <LoadingContext.Provider value={value}>
        <div
          // Content container
          ref={contentContainer}
          style={{
            opacity: isSSR ? 1 : 0,
            position: isSSR ? 'unset' : 'absolute',
            width: isSSR ? 'unset' : '100%',
          }}
        >
          {children}
        </div>
        <div
          // Loader container
          ref={loaderContainer}
          suppressHydrationWarning
          style={{ display: isSSR ? 'none' : 'unset' }}
        >
          {/** TODO: Use a better preview in the future */}
          <GenericPreview />
        </div>
      </LoadingContext.Provider>
    ),
    [children, isSSR, value]
  )

  return returnValue
}

const useLoadingContext = () => {
  return useContext(LoadingContext)
}

const withLoading = <T extends {}>(Component: ComponentType<T>) => {
  const EnhancedComponent: FunctionComponent<T> = props => {
    const isSSR = !window.navigator
    const { setLoading } = useLoadingContext()

    if (isSSR) {
      return <Component {...props} setLoading={() => {}} />
    }

    return <Component {...props} setLoading={setLoading} />
  }

  EnhancedComponent.displayName = `WithLoading(${Component.displayName ||
    Component.name ||
    'Component'})`

  return EnhancedComponent
}

export {
  LoadingWrapper,
  useLoadingContext,
  withLoading,
  LoadingContextProvider,
}
