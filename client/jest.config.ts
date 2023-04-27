import { type JestConfigWithTsJest, pathsToModuleNameMapper } from 'ts-jest'
const { compilerOptions } = require('./tsconfig.node.json')

const jestConfig: JestConfigWithTsJest = {
    testEnvironment: 'node',
    roots: ['<rootDir>'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        // '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.node.json',
                useESM: true,
            }
        ]
    },
    transformIgnorePatterns: ['<rootDir>/node_modules/']
}

export default jestConfig