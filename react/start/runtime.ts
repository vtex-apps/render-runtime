const getValue = (element: HTMLTemplateElement) => {
  if (typeof element.content === 'undefined') {
    return element.textContent as string
  }

  // Using textContent instead of innerHTML because it's faster
  let value = ''
  const childNodes = element.content.childNodes
  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i]
    value += node.textContent
  }
  return value
}

export const loadRuntimeJSONs = (): Promise<void | void[]> => {
  const scripts = window?.document?.querySelectorAll<HTMLTemplateElement>(
    'template[data-type="json"]'
  )
  if (!scripts || scripts.length === 0) {
    return Promise.resolve()
  }

  const promises = Array.from(scripts).map(
    (script) =>
      new Promise<void>((resolve) => {
        setTimeout(() => {
          const value = getValue(script)
          setTimeout(() => {
            const { varname, field } = script.dataset
            const windowAsAny = window as any
            if (varname) {
              if (field && windowAsAny[varname]) {
                windowAsAny[varname][field] = JSON.parse(value)
              } else {
                windowAsAny[varname] = JSON.parse(value)
              }
            }
            resolve()
          }, 1)
        }, 1)
      })
  )

  return Promise.all(promises)
}
