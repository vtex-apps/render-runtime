import { promised } from '../utils/promise'

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

const writeVarToWindow = (template: HTMLTemplateElement, value: string) => {
  const { varname, field } = template.dataset
  const windowAsAny = window as any
  if (!varname) {
    console.error('Missing data-varname:', template)
    return
  }

  if (!field) {
    windowAsAny[varname] = JSON.parse(value)
    return
  }

  if (!windowAsAny[varname]) {
    console.error(`Global var ${varname} not found to set ${field}`)
  }

  windowAsAny[varname][field] = JSON.parse(value)
}

export const loadRuntimeJSONs = (): Promise<void | void[]> => {
  const templates = window?.document?.querySelectorAll<HTMLTemplateElement>(
    'template[data-type="json"]'
  )
  if (!templates || templates.length === 0) {
    return Promise.resolve()
  }

  const promises = Array.from(templates).map((template) =>
    promised<string>((resolve) => {
      const value = getValue(template)
      resolve(value)
    }).then((value) =>
      promised<void>((resolve) => {
        writeVarToWindow(template, value)
        resolve()
      })
    )
  )

  return Promise.all(promises)
}
