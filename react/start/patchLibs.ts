import { createCustomReactApollo } from '../utils/reactApollo'
import { createReactIntl } from '../utils/reactIntl'

export const patchLibs = () => {
  if (window.ReactApollo) {
    window.ReactApollo = createCustomReactApollo()
  }

  if (window.ReactIntl) {
    window.ReactIntl = createReactIntl()
  }
}
