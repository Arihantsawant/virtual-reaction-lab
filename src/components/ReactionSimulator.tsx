import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import { ArrowRight, Play, Save, Thermometer, Zap, Plus, Minus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MoleculeViewer } from "./MoleculeViewer";
import { Progress } from "@/components/ui/progress";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ReactionInputs } from "./simulator/ReactionInputs";
import { ReactionVisualization } from "./simulator/ReactionVisualization";
import { ReactionSafetyPanel } from "./simulator/ReactionSafetyPanel";
import { ReactionControls } from "./simulator/ReactionControls";
import {
  SOLVENT_SMILES,
  SOLVENT_OPTIONS,
  COMMON_REACTANTS,
  COMMON_SOLUTES,
  estimateReactionTimeMinutes,
  scoreFromSeed,
  type ReactionConditions,
} from "./simulator/config";

/* ReactionConditions type moved to ./simulator/config */

/* SOLVENT_SMILES moved to ./simulator/config */

/* COMMON_REACTANTS moved to ./simulator/config */

/* COMMON_SOLUTES moved to ./simulator/config */

// Add: simple deterministic estimated time helper
// This is a heuristic for display purposes only
/* estimateReactionTimeMinutes moved to ./simulator/config */

// Add: Solvent options for the Select (labels kept identical to previous UI)
/* SOLVENT_OPTIONS moved to ./simulator/config */

/* moved into component
const resolveCompound = useAction(api.pubchem.resolveCompound);
// Add: FastAPI cheminformatics actions
const validateStructureFastApi = useAction(api.cheminfo.validateStructure);
const normalizeSmilesFastApi = useAction(api.cheminfo.normalizeSmiles);

const sanitizeSmiles = (input: string) => {
  const allowed = /[A-Za-z0-9@\+\-\[\]\(\)=#\\\/\.\*:]/g;
  const cleaned = (input.match(allowed) || []).join("");
  return cleaned.slice(0, 200);
};

// handlers to manage dynamic fields
const updateReactant = (idx: number, value: string) => {
  const next = [...reactants];
  next[idx] = sanitizeSmiles(value);
  setReactants(next);
};
const addReactant = () => setReactants((r) => [...r, ""]);
const removeReactant = (idx: number) =>
  setReactants((r) => r.filter((_, i) => i !== idx));

const updateSolute = (idx: number, value: string) => {
  const next = [...solutes];
  next[idx] = sanitizeSmiles(value);
  setSolutes(next);
};
const addSolute = () => setSolutes((s) => [...s, ""]);
const removeSolute = (idx: number) =>
  setSolutes((s) => s.filter((_, i) => i !== idx));

const addReactantFromLibrary = (smiles: string) => {
  setReactants((r) => [...r, smiles]);
  toast.success("Reactant added from library");
};
const addSoluteFromLibrary = (smiles: string) => {
  setSolutes((s) => [...s, smiles]);
  toast.success("Solute added from library");
};

// Add: Validate via PubChem to correct to canonical SMILES and gather IUPAC names
const handleValidateViaPubChem = async () => {
  try {
    const reactantResults = await Promise.all(
      reactants.map(async (r) => {
        const q = r.trim();
        if (!q) return { original: r };
        // Try resolve by SMILES first, fallback to name if needed
        const bySmiles = await resolveCompound({ query: q, namespace: "smiles" });
        const res = bySmiles?.cid
          ? bySmiles
          : await resolveCompound({ query: q, namespace: "name" });
        return {
          original: r,
          canonical: res?.canonicalSmiles || r,
          iupac: res?.iupacName || null,
        };
      }),
    );

    const soluteResults = await Promise.all(
      solutes.map(async (s) => {
        const q = s.trim();
        if (!q) return { original: s };
        const bySmiles = await resolveCompound({ query: q, namespace: "smiles" });
        const res = bySmiles?.cid
          ? bySmiles
          : await resolveCompound({ query: q, namespace: "name" });
        return {
          original: s,
          canonical: res?.canonicalSmiles || s,
          iupac: res?.iupacName || null,
        };
      }),
    );

    // Update canonical SMILES if PubChem returned it
    const nextReactants = reactantResults.map((r) => r.canonical ?? r.original);
    const nextSolutes = soluteResults.map((s) => s.canonical ?? s.original);
    setReactants(nextReactants);
    setSolutes(nextSolutes);

    // Prepare a concise summary for toasts
    const reactantNames = reactantResults
      .map((r, i) => (r.iupac ? `R${i + 1}: ${r.iupac}` : null))
      .filter(Boolean)
      .join("; ");
    const soluteNames = soluteResults
      .map((s, i) => (s.iupac ? `S${i + 1}: ${s.iupac}` : null))
      .filter(Boolean)
      .join("; ");

    if (reactantNames || soluteNames) {
      toast.success(
        `${reactantNames ? `Reactants → ${reactantNames}. ` : ""}${
          soluteNames ? `Solutes → ${soluteNames}.` : ""
        }`,
      );
    } else {
      toast.success("Validated via PubChem (no changes needed).");
    }
  } catch (e) {
    toast.error("Validation failed (PubChem). Please try again.");
  }
};

// Add: Validate reactants via FastAPI Cheminformatics
const handleValidateViaCheminfo = async () => {
  try {
    const checks = await Promise.all(
      reactants.map(async (r, i) => {
        const q = r.trim();
        if (!q) return { i, status: "empty" as const };
        const res = await validateStructureFastApi({ structure: q });
        return {
          i,
          status: res.isValid ? ("valid" as const) : ("invalid" as const),
          msg: res.message,
        };
      }),
    );
    const invalid = checks.filter((c) => c.status === "invalid");
    if (invalid.length === 0) {
      toast.success("All reactants valid (FastAPI).");
    } else {
      toast.error(
        `Invalid reactants: ${invalid
          .map((c) => `R${c.i + 1}${c.msg ? ` (${c.msg})` : ""}`)
          .join(", ")}`,
      );
    }
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.includes("FASTAPI_CHEM_BASE_URL")) {
      toast.error("FastAPI backend not configured. Set FASTAPI_CHEM_BASE_URL in Integrations.");
    } else {
      toast.error("FastAPI validation failed.");
    }
  }
};

// Add: Normalize all SMILES via FastAPI Cheminformatics
const handleNormalizeViaCheminfo = async () => {
  try {
    const reactantResults = await Promise.all(
      reactants.map(async (r) => {
        const q = r.trim();
        if (!q) return r;
        const res = await normalizeSmilesFastApi({ smiles: q });
        return res?.canonicalSmiles || r;
      }),
    );
    const soluteResults = await Promise.all(
      solutes.map(async (s) => {
        const q = s.trim();
        if (!q) return s;
        const res = await normalizeSmilesFastApi({ smiles: q });
        return res?.canonicalSmiles || s;
      }),
    );
    setReactants(reactantResults);
    setSolutes(soluteResults);
    toast.success("Normalized via FastAPI Cheminformatics.");
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.includes("FASTAPI_CHEM_BASE_URL")) {
      toast.error("FastAPI backend not configured. Set FASTAPI_CHEM_BASE_URL in Integrations.");
    } else {
      toast.error("SMILES normalization failed (FastAPI).");
    }
  }
};

// Derived SMILES for solvent and solution previews
const solventSmiles = SOLVENT_SMILES[conditions.solvent] ?? "O";
const solutionSeedBefore = `${reactants.filter(Boolean).join(".") || ""}+${solventSmiles}${solutes.length ? "+" + solutes.filter(Boolean).join(".") : ""}`;
const solutionSeedAfter =
  products.length > 0
    ? `${products.join(".")}+${solventSmiles}${solutes.length ? "+" + solutes.filter(Boolean).join(".") : ""}`
    : solutionSeedBefore;

/* scoreFromSeed moved to ./simulator/config */

// Add: derive estimate text
const estimatedMinutes = estimateReactionTimeMinutes(
  reactants.filter((r) => r.trim()).length,
  solutes.filter((s) => s.trim()).length,
  conditions.solvent,
  conditions.temperature,
  conditions.pressure,
);
const estimateText = estimatedMinutes >= 60
  ? `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`
  : `${estimatedMinutes} min`;

const handleSimulate = async () => {
  const hasAtLeastOneReactant = reactants.some((r) => r.trim().length > 0);
  if (!hasAtLeastOneReactant) {
    toast.error("Add at least one reactant.");
    return;
  }
  setIsSimulating(true);
  // Reset previous outputs
  setProducts([]);
  setByproducts([]);

  await new Promise((resolve) => setTimeout(resolve, 1600));

  // Mock reaction products (deterministic-ish based on inputs)
  const seedBase =
    reactants.join(".") + "|" + solutes.join(".") + "|" + conditions.solvent;
  const productA = reactants[0]?.includes("CCO") ? "CH3CHO" : "CCO";
  const productB = seedBase.includes("O") ? "H2O" : "CO2";

  // Treat primary vs. byproducts separately
  setProducts([productA]);
  setByproducts([productB]);

  setIsSimulating(false);

  toast.success("Reaction simulation completed!");
};

const handleSaveReaction = () => {
  if (products.length === 0) {
    toast.error("Run a simulation before saving.");
    return;
  }
  toast.success("Reaction saved to your library!");
};

const canRun = reactants.some((r) => r.trim().length > 0) && !isSimulating;

*/
export function ReactionSimulator() {
  const [reactants, setReactants] = useState<string[]>(["CCO"]);
  const [solutes, setSolutes] = useState<string[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [byproducts, setByproducts] = useState<string[]>([]);
  const [conditions, setConditions] = useState<ReactionConditions>({
    temperature: 298,
    pressure: 1,
    solvent: "water",
  });
  const [isSimulating, setIsSimulating] = useState(false);

  // Hooks moved inside the component
  const resolveCompound = useAction(api.pubchem.resolveCompound);
  // Add: FastAPI cheminformatics actions
  const validateStructureFastApi = useAction(api.cheminfo.validateStructure);
  const normalizeSmilesFastApi = useAction(api.cheminfo.normalizeSmiles);

  // Add from library handlers
  const addReactantFromLibrary = (smiles: string) => {
    setReactants((r) => [...r, smiles]);
    toast.success("Reactant added from library");
  };
  const addSoluteFromLibrary = (smiles: string) => {
    setSolutes((s) => [...s, smiles]);
    toast.success("Solute added from library");
  };

  // Derived SMILES for solvent and solution previews
  const solventSmiles = SOLVENT_SMILES[conditions.solvent] ?? "O";
  const solutionSeedBefore = `${reactants.filter(Boolean).join(".") || ""}+${solventSmiles}${solutes.length ? "+" + solutes.filter(Boolean).join(".") : ""}`;
  const solutionSeedAfter =
    products.length > 0
      ? `${products.join(".")}+${solventSmiles}${solutes.length ? "+" + solutes.filter(Boolean).join(".") : ""}`
      : solutionSeedBefore;

  // deterministic pseudo-scores from a seed string
  const scoreFromSeed = (seed: string, salt: string) => {
    let h = 2166136261 >>> 0;
    const s = seed + "|" + salt;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    // map to 5..95 for nicer percentages
    return 5 + (h >>> 0) % 91;
  };

  // Add: derive estimate text
  const estimatedMinutes = estimateReactionTimeMinutes(
    reactants.filter((r) => r.trim()).length,
    solutes.filter((s) => s.trim()).length,
    conditions.solvent,
    conditions.temperature,
    conditions.pressure,
  );
  const estimateText = estimatedMinutes >= 60
    ? `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`
    : `${estimatedMinutes} min`;

  // Add: Validate via PubChem to correct to canonical SMILES and gather IUPAC names
  const handleValidateViaPubChem = async () => {
    try {
      const reactantResults = await Promise.all(
        reactants.map(async (r) => {
          const q = r.trim();
          if (!q) return { original: r } as any;
          // Try resolve by SMILES first, fallback to name if needed
          const bySmiles = await resolveCompound({ query: q, namespace: "smiles" });
          const res = (bySmiles as any)?.cid
            ? bySmiles
            : await resolveCompound({ query: q, namespace: "name" });
          return {
            original: r,
            canonical: (res as any)?.canonicalSmiles || r,
            iupac: (res as any)?.iupacName || null,
          };
        }),
      );

      const soluteResults = await Promise.all(
        solutes.map(async (s) => {
          const q = s.trim();
          if (!q) return { original: s } as any;
          const bySmiles = await resolveCompound({ query: q, namespace: "smiles" });
          const res = (bySmiles as any)?.cid
            ? bySmiles
            : await resolveCompound({ query: q, namespace: "name" });
          return {
            original: s,
            canonical: (res as any)?.canonicalSmiles || s,
            iupac: (res as any)?.iupacName || null,
          };
        }),
      );

      // Update canonical SMILES if PubChem returned it
      const nextReactants = reactantResults.map((r: any) => r.canonical ?? r.original);
      const nextSolutes = soluteResults.map((s: any) => s.canonical ?? s.original);
      setReactants(nextReactants);
      setSolutes(nextSolutes);

      // Prepare a concise summary for toasts
      const reactantNames = reactantResults
        .map((r: any, i: number) => (r.iupac ? `R${i + 1}: ${r.iupac}` : null))
        .filter(Boolean)
        .join("; ");
      const soluteNames = soluteResults
        .map((s: any, i: number) => (s.iupac ? `S${i + 1}: ${s.iupac}` : null))
        .filter(Boolean)
        .join("; ");

      if (reactantNames || soluteNames) {
        toast.success(
          `${reactantNames ? `Reactants → ${reactantNames}. ` : ""}${soluteNames ? `Solutes → ${soluteNames}.` : ""}`,
        );
      } else {
        toast.success("Validated via PubChem (no changes needed).");
      }
    } catch (e) {
      toast.error("Validation failed (PubChem). Please try again.");
    }
  };

  // Add: Validate reactants via FastAPI Cheminformatics
  const handleValidateViaCheminfo = async () => {
    try {
      const checks = await Promise.all(
        reactants.map(async (r, i) => {
          const q = r.trim();
          if (!q) return { i, status: "empty" as const };
          const res = await validateStructureFastApi({ structure: q });
          return {
            i,
            status: (res as any).isValid ? ("valid" as const) : ("invalid" as const),
            msg: (res as any).message,
          };
        }),
      );
      const invalid = checks.filter((c) => c.status === "invalid");
      if (invalid.length === 0) {
        toast.success("All reactants valid (FastAPI).");
      } else {
        toast.error(
          `Invalid reactants: ${invalid
            .map((c: any) => `R${c.i + 1}${c.msg ? ` (${c.msg})` : ""}`)
            .join(", ")}`,
        );
      }
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes("FASTAPI_CHEM_BASE_URL")) {
        toast.error("FastAPI backend not configured. Set FASTAPI_CHEM_BASE_URL in Integrations.");
      } else {
        toast.error("FastAPI validation failed.");
      }
    }
  };

  // Add: Normalize all SMILES via FastAPI Cheminformatics
  const handleNormalizeViaCheminfo = async () => {
    try {
      const reactantResults = await Promise.all(
        reactants.map(async (r) => {
          const q = r.trim();
          if (!q) return r;
          const res = await normalizeSmilesFastApi({ smiles: q });
          return (res as any)?.canonicalSmiles || r;
        }),
      );
      const soluteResults = await Promise.all(
        solutes.map(async (s) => {
          const q = s.trim();
          if (!q) return s;
          const res = await normalizeSmilesFastApi({ smiles: q });
          return (res as any)?.canonicalSmiles || s;
        }),
      );
      setReactants(reactantResults);
      setSolutes(soluteResults);
      toast.success("Normalized via FastAPI Cheminformatics.");
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes("FASTAPI_CHEM_BASE_URL")) {
        toast.error("FastAPI backend not configured. Set FASTAPI_CHEM_BASE_URL in Integrations.");
      } else {
        toast.error("SMILES normalization failed (FastAPI).");
      }
    }
  };

  const handleSimulate = async () => {
    const hasAtLeastOneReactant = reactants.some((r) => r.trim().length > 0);
    if (!hasAtLeastOneReactant) {
      toast.error("Add at least one reactant.");
      return;
    }
    setIsSimulating(true);
    // Reset previous outputs
    setProducts([]);
    setByproducts([]);

    await new Promise((resolve) => setTimeout(resolve, 1600));

    // Mock reaction products (deterministic-ish based on inputs)
    const seedBase =
      reactants.join(".") + "|" + solutes.join(".") + "|" + conditions.solvent;
    const productA = reactants[0]?.includes("CCO") ? "CH3CHO" : "CCO";
    const productB = seedBase.includes("O") ? "H2O" : "CO2";

    // Treat primary vs. byproducts separately
    setProducts([productA]);
    setByproducts([productB]);

    setIsSimulating(false);

    toast.success("Reaction simulation completed!");
  };

  const handleSaveReaction = () => {
    if (products.length === 0) {
      toast.error("Run a simulation before saving.");
      return;
    }
    toast.success("Reaction saved to your library!");
  };

  const canRun = reactants.some((r) => r.trim().length > 0) && !isSimulating;

  return (
    <div className="space-y-8">
      {/* Reaction Input (refactored) */}
      <ReactionInputs
        reactants={reactants}
        setReactants={setReactants}
        solutes={solutes}
        setSolutes={setSolutes}
        conditions={conditions}
        setConditions={(updater) => setConditions(updater)}
        commonReactants={COMMON_REACTANTS}
        commonSolutes={COMMON_SOLUTES}
        solventOptions={SOLVENT_OPTIONS}
        estimatedText={estimateText}
        addReactantFromLibrary={addReactantFromLibrary}
        addSoluteFromLibrary={addSoluteFromLibrary}
      />

      {/* Visualization (refactored) */}
      <ReactionVisualization
        reactants={reactants}
        products={products}
        byproducts={byproducts}
        solventSmiles={solventSmiles}
        solutionSeedAfter={solutionSeedAfter}
      />

      {/* Controls (refactored) */}
      <ReactionControls
        onSimulate={handleSimulate}
        onValidatePubChem={handleValidateViaPubChem}
        onValidateCheminfo={handleValidateViaCheminfo}
        onNormalizeCheminfo={handleNormalizeViaCheminfo}
        onSave={handleSaveReaction}
        canRun={canRun}
        isSimulating={isSimulating}
        canSave={products.length > 0}
      />

      {/* Safety & Compliance (refactored) */}
      <ReactionSafetyPanel
        products={products}
        solventSmiles={solventSmiles}
        scoreFromSeed={scoreFromSeed}
      />
    </div>
  );
}