import React, { useMemo, Fragment, FC } from 'react'
import { IntlProvider } from 'react-intl'
import { getImplementation } from '../utils/assets'

interface Props {
  components: RenderRuntime['components']
  locale: string
  messages: RenderRuntime['messages']
}

const noop = () => {}

const getCustomMessages = (
  components: RenderRuntime['components'],
  locale: string
) => {
  const componentsArray = Object.keys(components)

  const customMessages = componentsArray
    .map(getImplementation)
    .filter(
      component =>
        component && (component.getCustomMessages || component.WrappedComponent)
    )
    .map(component => {
      const getComponentCustomMessages =
        component.getCustomMessages ||
        (component.WrappedComponent &&
          component.WrappedComponent.getCustomMessages) ||
        noop
      return getComponentCustomMessages(locale)
    })
    .reduce((acc: Record<string, string>, strings?: Record<string, string>) => {
      if (!strings) {
        return acc
      }
      const keys = Object.keys(strings)
      for (const key of keys) {
        acc[key] = strings[key]
      }
      return acc
    }, {})

  return customMessages
}

const MessagesProvider: FC<Props> = ({
  messages,
  locale,
  components,
  children,
}) => {
  const mergedMessages = useMemo(() => {
    const customMessages = getCustomMessages(components, locale)
    return {
      ...messages,
      ...customMessages,
    }
  }, [components, locale, messages])

  return (
    <IntlProvider
      locale={locale}
      messages={mergedMessages}
      textComponent={Fragment}
    >
      {children}
    </IntlProvider>
  )
}

export default MessagesProvider
