import {canUseDOM} from 'exenv'

const acceptJson = canUseDOM && new Headers({
  'Accept': 'application/json',
})

export const fetchRuntime = () =>
  fetch('?vtex.render-resource=runtime', {
    credentials: 'same-origin',
    headers: acceptJson,
  }).then(res => res.json())
