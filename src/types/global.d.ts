declare global {
  interface Window {
    /**
     * Navigate to the auth page with a custom redirect URL
     * @param redirectUrl - URL to redirect to after successful authentication
     */
    navigateToAuth: (redirectUrl: string) => void;
  }
}

/**
 * Minimal ambient declarations so `import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"`
 * compiles in environments where vitest types aren't installed.
 * This is only for type-checking; the real test runner will provide actual implementations.
 */
declare module "vitest" {
  export const describe: (...args: any[]) => void;
  export const it: (...args: any[]) => void;
  export const expect: any;
  export const vi: any;
  export const beforeEach: (...args: any[]) => void;
  export const afterEach: (...args: any[]) => void;
}

export {};