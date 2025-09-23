import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Internal mutation (separate file; no "use node")
export const storeChemResult = internalMutation({
  args: {
    type: v.string(),
    input: v.any(),
    result: v.any(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("cheminfo_results", args);
  },
});
