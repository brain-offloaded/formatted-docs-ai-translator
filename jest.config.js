module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  roots: ['<rootDir>/apps/backend/src'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/apps/backend/tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/backend/src/$1',
    '^@apps/common/dist/(.*)$': '<rootDir>/apps/common/src/$1',
  },
  testTimeout: 10000,
};
