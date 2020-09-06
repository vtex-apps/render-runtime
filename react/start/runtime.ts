const getValue = (element: HTMLTemplateElement) => {
  if (typeof element.content === 'undefined') {
    return element.innerHTML
  }

  let value = ''
  const childNodes = element.content.childNodes
  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i]
    value += node.nodeValue
  }
  return value
}

export const loadRuntimeJSONs = () => {
  const scripts = window?.document?.querySelectorAll<HTMLTemplateElement>(
    'template[data-type="json"]'
  )
  if (!scripts || scripts.length === 0) {
    return Promise.resolve()
  }

  const promises = Array.from(scripts).map(
    (script) =>
      new Promise((resolve) => {
        setTimeout(() => {
          const value = getValue(script)
          setTimeout(() => {
            ;(window as any)[script.id] = JSON.parse(value)
            resolve()
          }, 1)
        }, 1)
      })
  )

  return new Promise((resolve) => {
    Promise.all(promises).then(() => {
      window.__RUNTIME__.extensions =
        window.__RUNTIME_EXTENSIONS__ ?? window.__RUNTIME__.extensions
      resolve()
    })
  })
}
