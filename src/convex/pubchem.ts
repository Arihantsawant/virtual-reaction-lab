"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

type PubChemPropertiesResponse = {
  PropertyTable?: {
    Properties?: Array<{
      CID: number;
      IUPACName?: string;
      CanonicalSMILES?: string;
      MolecularFormula?: string;
      MolecularWeight?: number;
    }>;
  };
};

const PUBCHEM_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";

// Resolve a compound by name or SMILES and return key fields (no API key required)
export const resolveCompound = action({
  args: {
    query: v.string(),
    namespace: v.union(v.literal("name"), v.literal("smiles")),
  },
  handler: async (ctx, args) => {
    const { query, namespace } = args;

    // Step 1: get CID
    const cidUrl = `${PUBCHEM_BASE}/compound/${namespace}/${encodeURIComponent(
      query,
    )}/cids/JSON`;

    let cid: number | null = null;
    try {
      const r = await fetch(cidUrl, { method: "GET" });
      if (!r.ok) {
        // 404 etc — treat as not found
        return { cid: null };
      }
      const data = (await r.json()) as any;
      const list = data?.IdentifierList?.CID ?? [];
      cid = Array.isArray(list) && list.length > 0 ? Number(list[0]) : null;
      if (!cid) return { cid: null };
    } catch {
      return { cid: null };
    }

    // Step 2: request combined properties in one call
    const props = "IUPACName,CanonicalSMILES,MolecularFormula,MolecularWeight";
    const propUrl = `${PUBCHEM_BASE}/compound/cid/${cid}/property/${props}/JSON`;

    try {
      const r = await fetch(propUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!r.ok) return { cid, iupacName: null, canonicalSmiles: null };

      const json = (await r.json()) as PubChemPropertiesResponse;
      const first = json?.PropertyTable?.Properties?.[0];
      if (!first) return { cid, iupacName: null, canonicalSmiles: null };

      return {
        cid,
        iupacName: first.IUPACName ?? null,
        canonicalSmiles: first.CanonicalSMILES ?? null,
        molecularFormula: first.MolecularFormula ?? null,
        molecularWeight: first.MolecularWeight ?? null,
      };
    } catch {
      return { cid, iupacName: null, canonicalSmiles: null };
    }
  },
});

// Add: fetch synonyms for a given identifier (name | smiles | cid)
export const getSynonyms = action({
  args: {
    identifier: v.string(),
    namespace: v.union(v.literal("name"), v.literal("smiles"), v.literal("cid")),
  },
  handler: async (ctx, args) => {
    const { identifier, namespace } = args;
    const url = `${PUBCHEM_BASE}/compound/${namespace}/${encodeURIComponent(identifier)}/synonyms/JSON`;
    try {
      const r = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
      if (!r.ok) return [];
      const json = (await r.json()) as any;
      const list = json?.InformationList?.Information?.[0]?.Synonym ?? [];
      return Array.isArray(list) ? (list as string[]) : [];
    } catch {
      return [];
    }
  },
});

// Add: return a direct PNG image URL (2D or 3D) for client-side fetching
export const getImageUrl = action({
  args: {
    identifier: v.string(),
    namespace: v.union(v.literal("name"), v.literal("smiles"), v.literal("cid")),
    recordType: v.optional(v.union(v.literal("2d"), v.literal("3d"))),
    imageSize: v.optional(v.string()), // e.g., "large", "small", or "320x240" (2D only)
  },
  handler: async (ctx, args) => {
    const { identifier, namespace, recordType, imageSize } = args;
    let url = `${PUBCHEM_BASE}/compound/${namespace}/${encodeURIComponent(identifier)}/PNG`;
    const params = new URLSearchParams();
    if (recordType) params.set("record_type", recordType);
    if (imageSize) params.set("image_size", imageSize);
    const full = params.toString() ? `${url}?${params.toString()}` : url;

    // Optionally verify availability (light HEAD/GET check) but avoid heavy proxying.
    try {
      const r = await fetch(full, { method: "GET" });
      if (!r.ok) return full; // Return anyway; client can fetch directly
      // We return the URL for the client to fetch directly (no blobs/base64 here)
      return full;
    } catch {
      return full;
    }
  },
});