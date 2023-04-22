import { type JestConfigWithTsJest, pathsToModuleNameMapper } from 'ts-jest'
const { compilerOptions } = require('./tsconfig.node.json')

const jestConfig: JestConfigWithTsJest = {
    testEnvironment: 'node',
    roots: ['<rootDir>'],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>' }),
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.node.json'
            }
        ]
    },
}

export default jestConfig