const {
  account,
  workspace,
  hash,
  route,
  version,
  culture: {
    locale,
  },
  graphQlUri,
} = global.__RUNTIME__

const messages = {}

export default {
  account,
  workspace,
  hash,
  route,
  version,
  locale,
  messages,
  graphQlUri,
}
