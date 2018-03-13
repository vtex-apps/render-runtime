import {canUseDOM} from 'exenv'

const acceptJson = canUseDOM ? new Headers({
  'Accept': 'application/json',
}) : undefined

export const fetchRuntime = (graphQlUri: string) =>
  fetch(graphQlUri.replace('=graphql', '=runtime'), {
    credentials: 'include',
    headers: acceptJson,
  }).then<RenderRuntime>(res => res.json())
