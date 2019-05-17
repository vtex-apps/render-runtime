import { pluck, zipObj } from 'ramda'

export const parseMessages = (messages: KeyedString[] | null) => {
  return messages && zipObj(pluck('key', messages), pluck('message', messages))
}
