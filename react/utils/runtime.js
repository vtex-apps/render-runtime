import {canUseDOM} from 'exenv'

const acceptJson = canUseDOM && new Headers({
  'Accept': 'application/json',
})

export const fetchRuntime = (graphQlUri) =>
  fetch(graphQlUri.replace('=graphql', '=runtime'), {
    credentials: 'include',
    headers: acceptJson,
  }).then(res => res.json())
