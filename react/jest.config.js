module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "json"
  ],
  // "setupFilesAfterEnv": "<rootDir>/testUtils/setupTests.js",
  "moduleDirectories": [
    "node_modules",
    "testUtils"
  ],
  "transform": {
     "\\.(gql|graphql)$": "jest-transform-graphql",
     "^.+\\.(js|jsx|mjs)$": "<rootDir>/node_modules/babel-jest"
   },
  "globals": {
    "ts-jest": {
      "tsConfig": "tsconfig.test.json"
    }
  }
}
