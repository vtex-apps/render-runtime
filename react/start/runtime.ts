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
          let value = ''
          const childNodes = script.content.childNodes
          for (let i = 0; i < childNodes.length; i++) {
            const node = childNodes[i]
            value += node.nodeValue
          }
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
