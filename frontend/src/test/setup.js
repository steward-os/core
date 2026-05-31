import '@testing-library/jest-dom'

// Mock PocketBase
global.pb = {
  authStore: {
    isValid: false,
    record: null,
  },
  collection: () => ({
    getList: () => Promise.resolve({ items: [] }),
    getOne: () => Promise.resolve({}),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  }),
}