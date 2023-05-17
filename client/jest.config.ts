import { type JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
    testEnvironment: 'node',
    roots: ['<rootDir>'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/main/$1',
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