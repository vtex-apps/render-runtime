import React from 'react'
import { cleanup, render } from '@vtex/test-tools/react'
import { renderToString } from 'react-dom/server'
import 'jest-dom/extend-expect'
import ExtensionPoint from './index'
import { TreePathContextProvider } from '../../utils/treePath'
import { RenderContextProvider } from '../RenderContext'
import { TEST_ID as PreviewTestId } from '../Preview'
import { Extension } from '../../typings/runtime'

afterEach(cleanup)

test(`it shouldn't show Preview when there is no extension for current tree path`, () => {
  const mockExtensions: Record<string, Partial<Extension>> = {
    'store.search#category/search-result#category': {
      component: '',
      preview: {
        height: {
          desktop: { defaultValue: 500 },
          mobile: { defaultValue: 500 },
        },
        width: {
          desktop: { defaultValue: 500 },
          mobile: { defaultValue: 500 },
        },
        type: 'box',
      },
    },
    // The extension below is what the ExtensionPoint should use.
    // 'store.search#category/search-result#category/search-title': undefined,
  }

  const { queryByTestId } = render(
    <RenderContextProvider runtime={{ extensions: mockExtensions } as any}>
      <TreePathContextProvider treePath="store.search#category/search-result#category">
        <ExtensionPoint treePath="" id="search-title" />
      </TreePathContextProvider>
    </RenderContextProvider>
  )

  expect(queryByTestId(PreviewTestId)).toBeNull()
})

test(`it shouldn't show the parent's Preview for a client-rendered block that has no preview of its own`, () => {
  const mockExtensions: Record<string, Partial<Extension>> = {
    'store.search#category/search-result#category': {
      component: '',
      preview: {
        height: {
          desktop: { defaultValue: 500 },
          mobile: { defaultValue: 500 },
        },
        width: {
          desktop: { defaultValue: 500 },
          mobile: { defaultValue: 500 },
        },
        type: 'box',
      },
    },
    // Declares no preview of its own, so it should get no placeholder at all --
    // never the 500px box belonging to the block above it.
    'store.search#category/search-result#category/search-title': {
      component: '',
      render: 'client',
    },
  }

  /* Has to go through the server renderer: NoSSR only takes its onSSR branch there,
   * because under jsdom the layout effect runs and the children render instead. */
  const html = renderToString(
    <RenderContextProvider
      runtime={{ extensions: mockExtensions, getSettings: () => ({}) } as any}
    >
      <TreePathContextProvider treePath="store.search#category/search-result#category">
        <ExtensionPoint treePath="" id="search-title" />
      </TreePathContextProvider>
    </RenderContextProvider>
  )

  expect(html).not.toContain(PreviewTestId)
})
