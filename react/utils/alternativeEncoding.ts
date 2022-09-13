// Only newer versions of the query-string allow parse(url, {encode: false}).
// We can't upgrade it due to compatibility with IE
// For this reason, we need to create a new econding system for reserved characters

type EncodedChars = {
  encode: { [key: string]: string }
  decode: { [key: string]: string }
}

const encodedChars: EncodedChars = {
  encode: {
    '%3B': '$3B',
    '%3A': '$3A',
    '%40': '$40',
    '%26': '$26',
    '%3D': '$3D',
    '%2B': '$2B',
    '%24': '$24',
    '%2C': '$2C',
    '%2F': '$2F',
    '%3F': '$3F',
    '%25': '$25',
    '%23': '$23',
    '%5B': '$5B',
    '%5D': '$5D',
  },
  decode: {
    '\\$3B': '%3B',
    '\\$3A': '%3A',
    '\\$40': '%40',
    '\\$26': '%26',
    '\\$3D': '%3D',
    '\\$2B': '%2B',
    '\\$24': '%24',
    '\\$2C': '%2C',
    '\\$2F': '%2F',
    '\\$3F': '%3F',
    '\\$25': '%25',
    '\\$23': '%23',
    '\\$5B': '%5B',
    '\\$5D': '%5D',
  },
}

export const encodeReservedChars = (str: string) =>
  Object.keys(encodedChars.encode).reduce(
    (encodedURL, currentChar) =>
      encodedURL.replace(
        new RegExp(currentChar, 'gi'),
        encodedChars.encode[currentChar.toUpperCase()] as string
      ),
    str
  )

export const decodeReservedChars = (str: string) =>
  Object.keys(encodedChars.decode).reduce(
    (decodedURL, currentChar) =>
      decodedURL.replace(
        new RegExp(currentChar, 'gi'),
        encodedChars.decode[currentChar.toUpperCase()] as string
      ),
    str
  )
