import { extractExtra } from './extractExtra'

describe('extractExtra', () => {
  test('should return an empty object when err is an empty object', () => {
    const err = {}
    const result = extractExtra(err)
    expect(result).toEqual({})
  })

  test('should extract simple key-value pairs', () => {
    const err = { key1: 'value1', key2: 'value2' }
    const result = extractExtra(err)
    expect(result).toEqual({
      admin_extra_level_0_key1: 'value1',
      admin_extra_level_0_key2: 'value2',
    })
  })

  test('should extract nested objects', () => {
    const err = {
      key1: 'value1',
      nested: {
        key2: 'value2',
        deeper: {
          key3: 'value3',
        },
      },
    }
    const result = extractExtra(err)
    expect(result).toEqual({
      admin_extra_level_0_key1: 'value1',
      admin_extra_level_1_key2: 'value2',
      admin_extra_level_2_key3: 'value3',
    })
  })

  test('should ignore functions', () => {
    const err = {
      key1: 'value1',
      func: () => {},
    }
    const result = extractExtra(err)
    expect(result).toEqual({
      admin_extra_level_0_key1: 'value1',
    })
  })

  test('high fidelity example #1', () => {
    const err = {
      details: {
        graphQLErrors: '[Array]',
        message: 'messages',
        name: 'Error',
        stack:
          'Error: messages\n    at throwOnGraphQLErrors (/usr/local/app/node_modules/@vtex/api/lib/HttpClient/GraphQLClient.js:10:15)\n    at /usr/local/app/node_modules/@vtex/api/lib/HttpClient/GraphQLClient.js:23:15\n    at runMicrotasks (<anonymous>)\n    at processTicksAndRejections (node:internal/process/task_queues:96:5)\n    at MessagesGraphQL.translateWithDependencies (/usr/local/app/node_modules/@vtex/api/lib/clients/apps/MessagesGraphQL.js:66:26)\n    at dataloader_1.default.batch (/usr/local/app/node_modules/@vtex/api/lib/service/worker/runtime/graphql/schema/messagesLoaderV2.js:68:15)',
      },
      stack:
        'Error: messages\n    at throwOnGraphQLErrors (/usr/local/app/node_modules/@vtex/api/lib/HttpClient/GraphQLClient.js:10:15)\n    at /usr/local/app/node_modules/@vtex/api/lib/HttpClient/GraphQLClient.js:23:15\n    at runMicrotasks (<anonymous>)\n    at processTicksAndRejections (node:internal/process/task_queues:96:5)\n    at MessagesGraphQL.translateWithDependencies (/usr/local/app/node_modules/@vtex/api/lib/clients/apps/MessagesGraphQL.js:66:26)\n    at dataloader_1.default.batch (/usr/local/app/node_modules/@vtex/api/lib/service/worker/runtime/graphql/schema/messagesLoaderV2.js:68:15)',
    }

    const result = extractExtra(err)
    expect(result).toEqual({
      admin_extra_level_1_graphQLErrors: '[Array]',
      admin_extra_level_1_message: 'messages',
      admin_extra_level_1_name: 'Error',
      admin_extra_level_0_stack_0:
        'Error: messages\n    at throwOnGraphQLErrors (/usr/local/app/node_modules/@vtex/api/lib/HttpClient/GraphQLClient.js:10:15)\n    at /usr/local/app/node_modules/@vtex/api/lib/HttpClient/GraphQLClient.js:',
      admin_extra_level_0_stack_1:
        '23:15\n    at runMicrotasks (<anonymous>)\n    at processTicksAndRejections (node:internal/process/task_queues:96:5)\n    at MessagesGraphQL.translateWithDependencies (/usr/local/app/node_modules/@vtex/',
      admin_extra_level_0_stack_2:
        'api/lib/clients/apps/MessagesGraphQL.js:66:26)\n    at dataloader_1.default.batch (/usr/local/app/node_modules/@vtex/api/lib/service/worker/runtime/graphql/schema/messagesLoaderV2.js:68:15)',
      admin_extra_level_1_stack_0:
        'Error: messages\n    at throwOnGraphQLErrors (/usr/local/app/node_modules/@vtex/api/lib/HttpClient/GraphQLClient.js:10:15)\n    at /usr/local/app/node_modules/@vtex/api/lib/HttpClient/GraphQLClient.js:',
      admin_extra_level_1_stack_1:
        '23:15\n    at runMicrotasks (<anonymous>)\n    at processTicksAndRejections (node:internal/process/task_queues:96:5)\n    at MessagesGraphQL.translateWithDependencies (/usr/local/app/node_modules/@vtex/',
      admin_extra_level_1_stack_2:
        'api/lib/clients/apps/MessagesGraphQL.js:66:26)\n    at dataloader_1.default.batch (/usr/local/app/node_modules/@vtex/api/lib/service/worker/runtime/graphql/schema/messagesLoaderV2.js:68:15)',
    })
  })

  test('high fidelity example #2', () => {
    const err = {
      details: {
        code: 'ECONNABORTED',
        config: '[Object]',
        isAxiosError: true,
        message: 'timeout of 4000ms exceeded',
        name: 'Error',
        request: '[Object]',
        stack:
          'Error: timeout of 4000ms exceeded\n    at createError (/usr/local/app/node_modules/axios/lib/core/createError.js:16:15)\n    at ClientRequest.handleRequestTimeout (/usr/local/app/node_modules/axios/lib/adapters/http.js:280:16)\n    at Object.onceWrapper (node:events:627:28)\n    at ClientRequest.emit (node:events:513:28)\n    at Socket.emitRequestTimeout (node:_http_client:839:9)\n    at Object.onceWrapper (node:events:627:28)\n    at Socket.emit (node:events:525:35)\n    at Socket._onTimeout (node:net:550:8)\n    at listOnTimeout (node:internal/timers:559:17)\n    at processTimers (node:internal/timers:502:7)',
      },
      stack:
        'Error: timeout of 4000ms exceeded\n    at createError (/usr/local/app/node_modules/axios/lib/core/createError.js:16:15)\n    at ClientRequest.handleRequestTimeout (/usr/local/app/node_modules/axios/lib/adapters/http.js:280:16)\n    at Object.onceWrapper (node:events:627:28)\n    at ClientRequest.emit (node:events:513:28)\n    at Socket.emitRequestTimeout (node:_http_client:839:9)\n    at Object.onceWrapper (node:events:627:28)\n    at Socket.emit (node:events:525:35)\n    at Socket._onTimeout (node:net:550:8)\n    at listOnTimeout (node:internal/timers:559:17)\n    at processTimers (node:internal/timers:502:7)',
    }
    const result = extractExtra(err)
    expect(result).toEqual({
      admin_extra_level_1_code: 'ECONNABORTED',
      admin_extra_level_1_isAxiosError: true,
      admin_extra_level_1_message: 'timeout of 4000ms exceeded',
      admin_extra_level_1_name: 'Error',
      admin_extra_level_1_request: '[Object]',
      admin_extra_level_1_config: '[Object]',
      admin_extra_level_0_stack_0:
        'Error: timeout of 4000ms exceeded\n    at createError (/usr/local/app/node_modules/axios/lib/core/createError.js:16:15)\n    at ClientRequest.handleRequestTimeout (/usr/local/app/node_modules/axios/lib',
      admin_extra_level_0_stack_1:
        '/adapters/http.js:280:16)\n    at Object.onceWrapper (node:events:627:28)\n    at ClientRequest.emit (node:events:513:28)\n    at Socket.emitRequestTimeout (node:_http_client:839:9)\n    at Object.onceWr',
      admin_extra_level_0_stack_2:
        'apper (node:events:627:28)\n    at Socket.emit (node:events:525:35)\n    at Socket._onTimeout (node:net:550:8)\n    at listOnTimeout (node:internal/timers:559:17)\n    at processTimers (node:internal/tim',
      admin_extra_level_0_stack_3: 'ers:502:7)',
      admin_extra_level_1_stack_0:
        'Error: timeout of 4000ms exceeded\n    at createError (/usr/local/app/node_modules/axios/lib/core/createError.js:16:15)\n    at ClientRequest.handleRequestTimeout (/usr/local/app/node_modules/axios/lib',
      admin_extra_level_1_stack_1:
        '/adapters/http.js:280:16)\n    at Object.onceWrapper (node:events:627:28)\n    at ClientRequest.emit (node:events:513:28)\n    at Socket.emitRequestTimeout (node:_http_client:839:9)\n    at Object.onceWr',
      admin_extra_level_1_stack_2:
        'apper (node:events:627:28)\n    at Socket.emit (node:events:525:35)\n    at Socket._onTimeout (node:net:550:8)\n    at listOnTimeout (node:internal/timers:559:17)\n    at processTimers (node:internal/tim',
      admin_extra_level_1_stack_3: 'ers:502:7)',
    })
  })

  test('high fidelity example #3', () => {
    const err = {
      details: {
        code: 'E_HTTP_500',
        config: '[Object]',
        isAxiosError: true,
        message: 'Request failed with status code 500',
        name: 'Error',
        request: '[Object]',
        response: '[Object]',
        stack:
          'Error: Request failed with status code 500\n    at createError (/usr/local/app/node_modules/axios/lib/core/createError.js:16:15)\n    at settle (/usr/local/app/node_modules/axios/lib/core/settle.js:17:12)\n    at IncomingMessage.handleStreamEnd (/usr/local/app/node_modules/axios/lib/adapters/http.js:260:11)\n    at IncomingMessage.emit (node:events:525:35)\n    at endReadableNT (node:internal/streams/readable:1358:12)\n    at processTicksAndRejections (node:internal/process/task_queues:83:21)',
      },
      stack:
        'Error: Request failed with status code 500\n    at createError (/usr/local/app/node_modules/axios/lib/core/createError.js:16:15)\n    at settle (/usr/local/app/node_modules/axios/lib/core/settle.js:17:12)\n    at IncomingMessage.handleStreamEnd (/usr/local/app/node_modules/axios/lib/adapters/http.js:260:11)\n    at IncomingMessage.emit (node:events:525:35)\n    at endReadableNT (node:internal/streams/readable:1358:12)\n    at processTicksAndRejections (node:internal/process/task_queues:83:21)',
    }

    const result = extractExtra(err)
    expect(result).toEqual({
      admin_extra_level_1_code: 'E_HTTP_500',
      admin_extra_level_1_isAxiosError: true,
      admin_extra_level_1_message: 'Request failed with status code 500',
      admin_extra_level_1_name: 'Error',
      admin_extra_level_1_request: '[Object]',
      admin_extra_level_1_response: '[Object]',
      admin_extra_level_1_config: '[Object]',
      admin_extra_level_0_stack_0:
        'Error: Request failed with status code 500\n    at createError (/usr/local/app/node_modules/axios/lib/core/createError.js:16:15)\n    at settle (/usr/local/app/node_modules/axios/lib/core/settle.js:17:',
      admin_extra_level_0_stack_1:
        '12)\n    at IncomingMessage.handleStreamEnd (/usr/local/app/node_modules/axios/lib/adapters/http.js:260:11)\n    at IncomingMessage.emit (node:events:525:35)\n    at endReadableNT (node:internal/streams',
      admin_extra_level_0_stack_2:
        '/readable:1358:12)\n    at processTicksAndRejections (node:internal/process/task_queues:83:21)',

      admin_extra_level_1_stack_0:
        'Error: Request failed with status code 500\n    at createError (/usr/local/app/node_modules/axios/lib/core/createError.js:16:15)\n    at settle (/usr/local/app/node_modules/axios/lib/core/settle.js:17:',
      admin_extra_level_1_stack_1:
        '12)\n    at IncomingMessage.handleStreamEnd (/usr/local/app/node_modules/axios/lib/adapters/http.js:260:11)\n    at IncomingMessage.emit (node:events:525:35)\n    at endReadableNT (node:internal/streams',
      admin_extra_level_1_stack_2:
        '/readable:1358:12)\n    at processTicksAndRejections (node:internal/process/task_queues:83:21)',
    })
  })

  test('should return the original input when it is not an object (string)', () => {
    const err = 'error'
    const result = extractExtra(err)
    expect(result).toEqual(err)
  })

  test('should return the original input when it is not an object (boolean)', () => {
    const err = false
    const result = extractExtra(err)
    expect(result).toEqual(err)
  })

  test('should return the original input when it is not an object (undefined)', () => {
    const result = extractExtra(undefined)
    expect(result).toEqual(undefined)
  })

  test('circular references given as input returns an empty object', () => {
    class Validator {
      model: any

      constructor(model: any) {
        this.model = model
      }
    }

    class Model {
      _attributes: any
      validator: any

      constructor() {
        this._attributes = {}
        this.validator = new Validator(this)
      }
    }

    const model = new Model()

    const result = extractExtra(model)
    expect(result).toEqual({})
  })
})
