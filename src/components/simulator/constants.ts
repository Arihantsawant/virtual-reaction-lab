/**
 * Back-compat shim: re-export consolidated simulator config to avoid duplication.
 * Prefer importing from "./config" directly.
 */
export type { ReactionConditions } from "./config";
export {
  SOLVENT_SMILES,
  COMMON_REACTANTS,
  COMMON_SOLUTES,
  SOLVENT_OPTIONS,
  estimateReactionTimeMinutes,
  // Also expose scoreFromSeed for convenience if some code imported it from here.
  scoreFromSeed,
} from "./config";
