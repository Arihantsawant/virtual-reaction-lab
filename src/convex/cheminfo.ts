"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

type ValidatedStructure = { isValid: boolean; message?: string };
type CanonicalSmiles = { canonicalSmiles: string };
type Descriptors = Record<string, number>;
type ProductPrediction = { products: string[] };
type Coordinates = Array<{ x: number; y: number; z?: number }>;

const BASE_URL = process.env.FASTAPI_CHEM_BASE_URL;
const API_KEY = process.env.FASTAPI_CHEM_API_KEY;

// Helper to call the external FastAPI cheminformatics backend
async function callFastApi<T>(ctx: any, endpoint: string, data: unknown): Promise<T> {
  // Mark ctx as intentionally unused to satisfy strict TS settings
  void ctx;

  if (!BASE_URL) {
    throw new Error("FASTAPI_CHEM_BASE_URL is not set. Configure it in Integrations > FastAPI Cheminformatics.");
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`FastAPI error ${res.status} on ${endpoint}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const validateStructure = action({
  args: { structure: v.string() },
  handler: async (ctx, { structure }): Promise<ValidatedStructure> => {
    return await callFastApi<ValidatedStructure>(ctx, "/validate", { structure });
  },
});

export const normalizeSmiles = action({
  args: { smiles: v.string() },
  handler: async (ctx, { smiles }): Promise<CanonicalSmiles> => {
    return await callFastApi<CanonicalSmiles>(ctx, "/normalize_smiles", { smiles });
  },
});

export const computeDescriptors = action({
  args: { smiles: v.string() },
  handler: async (ctx, { smiles }): Promise<Descriptors> => {
    return await callFastApi<Descriptors>(ctx, "/descriptors", { smiles });
  },
});

export const predictProducts = action({
  args: {
    reactants: v.array(v.string()), // array of SMILES strings
    reagents: v.optional(v.array(v.string())),
    conditions: v.optional(v.object({
      temperature: v.optional(v.number()),
      pressure: v.optional(v.number()),
      solvent: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { reactants, reagents, conditions }): Promise<ProductPrediction> => {
    return await callFastApi<ProductPrediction>(ctx, "/predict_products", {
      reactants,
      reagents: reagents ?? [],
      conditions: conditions ?? {},
    });
  },
});

export const generate2DCoordinates = action({
  args: { smiles: v.string() },
  handler: async (ctx, { smiles }): Promise<Coordinates> => {
    return await callFastApi<Coordinates>(ctx, "/generate_2d", { smiles });
  },
});

export const generate3DCoordinates = action({
  args: { smiles: v.string() },
  handler: async (ctx, { smiles }): Promise<Coordinates> => {
    return await callFastApi<Coordinates>(ctx, "/generate_3d", { smiles });
  },
});

// Example: process & persist a validation result
export const processAndSaveStructure = action({
  args: { structure: v.string() },
  handler: async (ctx, { structure }) => {
    const result = await callFastApi<ValidatedStructure>(ctx, "/validate", { structure });
    await ctx.runMutation(internal.cheminfoMutations.storeChemResult, {
      type: "structure_validation",
      input: structure,
      result,
      timestamp: Date.now(),
    });
    return result;
  },
});

// Add test hook export at the end for unit testing the HTTP wrapper
// eslint-disable-next-line @typescript-eslint/naming-convention
export const __test = {
  callFastApi,
};