import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    molecules: defineTable({
      name: v.string(),
      smiles: v.string(),
      formula: v.string(),
      userId: v.id("users"),
      properties: v.optional(v.object({
        molecularWeight: v.optional(v.number()),
        logP: v.optional(v.number()),
        toxicity: v.optional(v.string()),
        hazardLevel: v.optional(v.string()),
      })),
    }).index("by_user", ["userId"]),

    reactions: defineTable({
      name: v.string(),
      reactants: v.array(v.string()),
      products: v.array(v.string()),
      userId: v.id("users"),
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
    }).index("by_user", ["userId"]),

    simulations: defineTable({
      name: v.string(),
      reactionId: v.id("reactions"),
      userId: v.id("users"),
      parameters: v.object({
        timeStep: v.number(),
        duration: v.number(),
        temperature: v.number(),
        pressure: v.number(),
      }),
      results: v.optional(v.object({
        energyProfile: v.array(v.number()),
        intermediates: v.array(v.string()),
        yieldPrediction: v.number(),
      })),
      status: v.string(), // "running", "completed", "failed"
    }).index("by_user", ["userId"])
      .index("by_reaction", ["reactionId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;