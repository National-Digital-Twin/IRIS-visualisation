import type { Config } from 'jest';

const jestConfig: Config = {
    maxWorkers: '50%',
    preset: 'jest-preset-angular',
    setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
    moduleNameMapper: {
        '@components/(.*)': '<rootDir>/src/app/components/$1',
        '@containers/(.*)': '<rootDir>/src/app/containers/$1',
        '@core/(.*)': '<rootDir>/src/app/core/$1',
        '@environment': '<rootDir>/src/environments/environment.test.ts',
        '@models/(.*)': '<rootDir>/src/app/models/$1',
    },
    coverageThreshold: {
        global: {
            branches: 0,
            functions: 0,
            lines: 0,
            statements: 0,
        },
    },
    coverageDirectory: './coverage',
    collectCoverageFrom: [
        '<rootDir>/src/**/*.ts',
        '!<rootDir>/src/main.ts',
        '!<rootDir>/src/app/app.config.ts',
        '!<rootDir>/src/app/app.routes.ts',
        '!<rootDir>/src/environments/*.ts',
    ],
    testPathIgnorePatterns: ['environment.test.ts'],
};

export default jestConfig;
