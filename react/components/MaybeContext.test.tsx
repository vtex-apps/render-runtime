import React from 'react'
import { cleanup, render } from '@vtex/test-tools/react'
import 'jest-dom/extend-expect'
import MaybeContext from './MaybeContext'

afterEach(cleanup)

const TEST_STRING = 'This is category '

beforeAll(() => {
  window.__RENDER_8_COMPONENTS__ = {
    product: function MockProduct(props: any) {
      return (
        <div>
          <h1>{props.title}</h1>
          <p>{TEST_STRING + props.categoryId}!</p>
        </div>
      )
    } as any,
  }
})

test(`it should pass props defined in extensions[path]context.props to the underlying component`, () => {
  const PAGE = 'store.product'
  const mockContextProps = { categoryId: 1, title: 'Product!' }
  const mockExtensions: Record<string, Partial<Extension>> = {
    [PAGE]: {
      context: {
        props: mockContextProps,
        component: 'product',
      },
    },
  }

  const mockRuntime: any = { extensions: mockExtensions }

  const { getByText } = render(
    <MaybeContext nestedPage={PAGE} runtime={mockRuntime} />
  )
  expect(getByText(new RegExp(mockContextProps.title, 'i'))).toBeInTheDocument()
  expect(
    getByText(new RegExp(TEST_STRING + mockContextProps.categoryId, 'i'))
  ).toBeInTheDocument()
})

afterAll(() => {
  delete window.__RENDER_8_COMPONENTS__
})
