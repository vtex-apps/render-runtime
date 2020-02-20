import React from 'react'
import { cleanup, render } from '@vtex/test-tools/react'
import 'jest-dom/extend-expect'
import ExtensionPoint from './index'
import { TreePathContextProvider } from '../../utils/treePath'
import { RenderContextProvider } from '../RenderContext'
import { TEST_ID as PreviewTestId } from '../Preview'

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
