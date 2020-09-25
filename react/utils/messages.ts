import { pluck, zipObj } from 'ramda'
import { KeyedString } from '../typings/global'

export const parseMessages = (messages: KeyedString[] | null) => {
  return messages && zipObj(pluck('key', messages), pluck('message', messages))
}
