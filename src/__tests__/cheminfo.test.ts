import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { __test as cheminfoTest } from "@/convex/cheminfo";

const originalEnv = { ...process.env };
const g: any = globalThis as any;

describe("cheminfo callFastApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("throws when FASTAPI_CHEM_BASE_URL is not set", async () => {
    delete process.env.FASTAPI_CHEM_BASE_URL;

    await expect(
      cheminfoTest.callFastApi({}, "/validate", { structure: "C" }),
    ).rejects.toThrow(/FASTAPI_CHEM_BASE_URL is not set/i);
  });

  it("calls endpoint with JSON and returns parsed body", async () => {
    process.env.FASTAPI_CHEM_BASE_URL = "https://chem.example.com";
    delete process.env.FASTAPI_CHEM_API_KEY;

    const mockJson = { isValid: true };
    const fetchSpy = vi.spyOn(g, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockJson,
    } as any);

    const result = await cheminfoTest.callFastApi({}, "/validate", { structure: "CCO" });
    expect(result).toEqual(mockJson);

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://chem.example.com/validate",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structure: "CCO" }),
      }),
    );
  });

  it("includes Authorization header when FASTAPI_CHEM_API_KEY is set", async () => {
    process.env.FASTAPI_CHEM_BASE_URL = "https://chem.example.com";
    process.env.FASTAPI_CHEM_API_KEY = "secret-key";

    vi.spyOn(g, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ canonicalSmiles: "CCO" }),
    } as any);

    await cheminfoTest.callFastApi({}, "/normalize_smiles", { smiles: "C(C)O" });

    const lastCall = (g.fetch as any).mock.calls.at(-1);
    const [, options] = lastCall;
    expect(options.headers.Authorization).toBe("Bearer secret-key");
  });

  it("throws with detailed message when response is not ok", async () => {
    process.env.FASTAPI_CHEM_BASE_URL = "https://chem.example.com";

    vi.spyOn(g, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "boom",
    } as any);

    await expect(
      cheminfoTest.callFastApi({}, "/validate", { structure: "X" }),
    ).rejects.toThrow(/FastAPI error 500 on \/validate: boom/);
  });
});
