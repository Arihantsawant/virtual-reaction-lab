// Minimal ambient module declarations for Vitest to satisfy TypeScript during type checking.
// This avoids creating/changing tsconfig and lets our tests compile.
declare module "vitest" {
  export const describe: (...args: any[]) => void;
  export const it: (...args: any[]) => void;
  export const test: (...args: any[]) => void;
  export const expect: any;
  export const vi: any;
  export const beforeEach: (...args: any[]) => void;
  export const afterEach: (...args: any[]) => void;
}
