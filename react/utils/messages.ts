import { pluck, zipObj } from 'ramda'

const YEAR_IN_MS = 12 * 30 * 24 * 60 * 60 * 1000

export const parseMessages = (messages: KeyedString[] | null) => {
  return messages && zipObj(pluck('key', messages), pluck('message', messages))
}
