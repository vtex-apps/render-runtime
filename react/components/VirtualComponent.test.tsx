/* eslint-disable react/display-name */
import React from 'react'
import { cleanup, render, waitForDomChange } from '@vtex/test-tools/react'

import 'jest-dom/extend-expect'
import { TreePathContextProvider } from '../utils/treePath'
import { RenderContextProvider } from './RenderContext'
import VirtualComponent from './VirtualComponent'

function renderVirtualComponent({
  treePath,
  extensions,
  fetchComponent,
  virtual,
}: any) {
  return render(
    <RenderContextProvider runtime={{ extensions, fetchComponent } as any}>
      <TreePathContextProvider treePath={treePath}>
        <VirtualComponent virtual={virtual} />
      </TreePathContextProvider>
    </RenderContextProvider>
  )
}

afterEach(cleanup)
afterEach(() => {
  window.__RENDER_8_COMPONENTS__ = {}
})

test(`renders a shallow virtual block with only real blocks`, () => {
  window.__RENDER_8_COMPONENTS__ = {
    div: (({ children, blockClass }: any) => (
      <div className={blockClass}>{children}</div>
    )) as any,
    rich: (({ text }: any) => <span>{text}</span>) as any,
  }

  const virtual = {
    $component: 'div',
    props: {
      blockClass: 'shelf',
    },
  }

  const { container } = renderVirtualComponent({
    extensions: { 'store.home/VirtualComponent': {} },
    treePath: 'store.home/VirtualComponent',
    virtual,
  })

  expect(container).toMatchInlineSnapshot(`
        <div>
          <div
            class="shelf"
          />
        </div>
    `)
})

test(`renders a deep virtual block with only real blocks`, () => {
  window.__RENDER_8_COMPONENTS__ = {
    div: (({ children, blockClass }: any) => (
      <div className={blockClass}>{children}</div>
    )) as any,
    rich: (({ text }: any) => <span>{text}</span>) as any,
    slider: (({ children }: any) => (
      <>
        Slider
        <ul>{children}</ul>
      </>
    )) as any,
    list: (({ categoryId, children }: any) => (
      <>
        <span>Category: {categoryId}</span>
        <ul>{children}</ul>
      </>
    )) as any,
  }

  const virtual = {
    $component: 'div',
    props: {
      blockClass: 'shelf',
    },
    children: [
      {
        $component: 'rich',
        props: {
          text: 'some title',
        },
      },
      {
        $component: 'slider',
        children: [
          {
            $component: 'list',
            props: {
              categoryId: 'some-category',
            },
          },
        ],
      },
    ],
  }

  const { container } = renderVirtualComponent({
    extensions: { 'store.home/VirtualComponent': {} },
    treePath: 'store.home/VirtualComponent',
    virtual,
  })

  expect(container).toMatchInlineSnapshot(`
    <div>
      <div
        class="shelf"
      >
        <span>
          some title
        </span>
        Slider
        <ul>
          <span>
            Category: 
            some-category
          </span>
          <ul />
        </ul>
      </div>
    </div>
  `)
})

test(`renders async children`, async () => {
  window.__RENDER_8_COMPONENTS__ = {
    div: (({ children, blockClass }: any) => (
      <div className={blockClass}>{children}</div>
    )) as any,
    rich: (({ text }: any) => <span>{text}</span>) as any,
  }

  const asyncComponents: any = {
    slider: (({ children }: any) => (
      <>
        Slider
        <ul>{children}</ul>
      </>
    )) as any,
    list: (({ categoryId, children }: any) => (
      <>
        <span>Category: {categoryId}</span>
        <ul>{children}</ul>
      </>
    )) as any,
  }

  const virtual = {
    $component: 'div',
    props: {
      blockClass: 'shelf',
    },
    children: [
      {
        $component: 'rich',
        props: {
          text: 'some title',
        },
      },
      {
        $component: 'slider',
        children: [
          {
            $component: 'list',
            props: {
              categoryId: 'some-category',
            },
          },
        ],
      },
    ],
  }

  const { container } = renderVirtualComponent({
    extensions: { 'store.home/VirtualComponent': {} },
    treePath: 'store.home/VirtualComponent',
    fetchComponent: async (name: string) => {
      window.__RENDER_8_COMPONENTS__[name] = asyncComponents[name]
    },
    virtual,
  })

  await waitForDomChange()

  expect(container).toMatchInlineSnapshot(`
    <div>
      <div
        class="shelf"
      >
        <span>
          some title
        </span>
        Slider
        <ul>
          <span>
            Category: 
            some-category
          </span>
          <ul />
        </ul>
      </div>
    </div>
  `)
})
