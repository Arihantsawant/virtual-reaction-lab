import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const saveReaction = mutation({
  args: {
    name: v.string(),
    reactants: v.array(v.string()), // SMILES strings
    products: v.array(v.string()), // SMILES strings
    conditions: v.object({
      temperature: v.number(),
      pressure: v.number(),
      solvent: v.string(),
    }),
    safetyAnalysis: v.optional(v.object({
      hazardLevel: v.string(),
      toxicity: v.string(),
      flammability: v.string(),
      energyRelease: v.number(),
    })),
    complianceStatus: v.optional(v.object({
      fda: v.string(),
      reach: v.string(),
      osha: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    return await ctx.db.insert("reactions", {
      ...args,
      userId: user._id,
    });
  },
});

export const getUserReactions = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    return await ctx.db
      .query("reactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const getReaction = query({
  args: { id: v.id("reactions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    const reaction = await ctx.db.get(args.id);
    if (!reaction || reaction.userId !== user._id) {
      throw new Error("Reaction not found");
    }

    return reaction;
  },
});
