import "dotenv/config";
import { vi } from "vitest";

// Avoid third-party clients throwing when app loads in CI/tests (no real services needed for integration tests).
if (!process.env.RESEND_API_KEY) process.env.RESEND_API_KEY = "re_123";
if (!process.env.MEILI_HOST_URL) process.env.MEILI_HOST_URL = "http://localhost:7700";
if (!process.env.MEILI_MASTER_KEY) process.env.MEILI_MASTER_KEY = "test-key";

// Simple chainable query builder mock that always resolves to an empty array.
const makeQuery = () => {
  const query: any = {};
  const chain = () => query;
  query.from = chain;
  query.where = chain;
  query.orderBy = chain;
  query.limit = chain;
  query.offset = chain;
  query.leftJoin = chain;
  query.groupBy = chain;
  query.then = (onFulfilled: any, onRejected?: any) =>
    Promise.resolve([]).then(onFulfilled, onRejected);
  return query;
};

// Mock Redis so app and rate limiter can load without a real connection.
// Must be defined before any import that uses redis (rateLimiter, etc.)
vi.mock("@/db/redis/redis.js", () => ({
  redis: {
    connect: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
    setEx: vi.fn().mockResolvedValue(undefined),
    mGet: vi.fn().mockResolvedValue([]),
    mSet: vi.fn().mockResolvedValue(undefined),
    mDel: vi.fn().mockResolvedValue(undefined),
    mSetEx: vi.fn().mockResolvedValue(undefined),
    mGetEx: vi.fn().mockResolvedValue(null),
    on: vi.fn(),
    isOpen: true,
  },
}));

// Mock Firebase admin to avoid requiring real service account in tests.
vi.mock("@/config/firebase/admin.js", () => {
  return {
    default: {
      credential: { cert: vi.fn() },
      initializeApp: vi.fn(),
      auth: vi.fn(() => ({
        verifyIdToken: vi.fn(),
        getUser: vi.fn(),
        createUser: vi.fn(),
        updateUser: vi.fn(),
      })),
    },
  };
});

// Mock Drizzle DB with chainable query builder that returns [] for all selects.
vi.mock("@/db/drizzle/index.js", () => ({
  db: {
    select: vi.fn(() => makeQuery()),
    insert: vi.fn(() => makeQuery()),
    update: vi.fn(() => makeQuery()),
    delete: vi.fn(() => makeQuery()),
  },
}));
