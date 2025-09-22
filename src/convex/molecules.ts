import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const saveMolecule = mutation({
  args: {
    name: v.string(),
    smiles: v.string(),
    formula: v.string(),
    properties: v.optional(v.object({
      molecularWeight: v.optional(v.number()),
      logP: v.optional(v.number()),
      toxicity: v.optional(v.string()),
      hazardLevel: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    return await ctx.db.insert("molecules", {
      ...args,
      userId: user._id,
    });
  },
});

export const getUserMolecules = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    return await ctx.db
      .query("molecules")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const getMolecule = query({
  args: { id: v.id("molecules") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    const molecule = await ctx.db.get(args.id);
    if (!molecule || molecule.userId !== user._id) {
      throw new Error("Molecule not found");
    }

    return molecule;
  },
});
