import { useState } from "react";
import { toast } from "sonner";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ReactionInputs } from "./simulator/ReactionInputs";
import { ReactionVisualization } from "./simulator/ReactionVisualization";
import { ReactionSafetyPanel } from "./simulator/ReactionSafetyPanel";
import { ReactionControls } from "./simulator/ReactionControls";
import {
  SOLVENT_SMILES as CONFIG_SOLVENT_SMILES,
  COMMON_REACTANTS as CONFIG_COMMON_REACTANTS,
  COMMON_SOLUTES as CONFIG_COMMON_SOLUTES,
  SOLVENT_OPTIONS as CONFIG_SOLVENT_OPTIONS,
  estimateReactionTimeMinutes as estimateFromConfig,
  scoreFromSeed as scoreFromConfig,
  type ReactionConditions,
} from "@/components/simulator/config";

const SOLVENT_SMILES: Record<string, string> = {
  // Show explicit hydrogens for water so the viewer renders H–O–H
  water: "[H]O[H]",
  ethanol: "CCO",
  methanol: "CO",
  isopropanol: "CC(O)C",
  acetone: "CC(C)=O",
  acetonitrile: "CC#N",
  dmso: "CS(=O)C",
  dmf: "CN(C)C=O",
  toluene: "Cc1ccccc1",
  benzene: "c1ccccc1",
  xylene: "Cc1cccc(C)c1",
  dichloromethane: "ClCCl",
  chloroform: "ClC(Cl)Cl",
  ether: "CCOCC",
  thf: "C1CCOC1",
  hexane: "CCCCCC",
  heptane: "CCCCCCC",
  dioxane: "O1CCOCC1",
};

const COMMON_REACTANTS: Array<{ label: string; smiles: string }> = [
  { label: "Ethanol", smiles: "CCO" },
  { label: "Acetic Acid", smiles: "CC(=O)O" },
  { label: "Acetaldehyde", smiles: "CC=O" },
  { label: "Benzene", smiles: "c1ccccc1" },
  { label: "Toluene", smiles: "Cc1ccccc1" },
  { label: "Aniline", smiles: "Nc1ccccc1" },
  { label: "Phenol", smiles: "Oc1ccccc1" },
  { label: "Methane", smiles: "C" },
  { label: "Propene", smiles: "C=CC" },
  { label: "Chloroform", smiles: "ClC(Cl)Cl" },
];

const COMMON_SOLUTES: Array<{ label: string; smiles: string }> = [
  { label: "Sodium Chloride", smiles: "[Na+].[Cl-]" },
  { label: "Sodium Hydroxide", smiles: "[Na+].[OH-]" },
  { label: "Hydrochloric Acid", smiles: "Cl" },
  { label: "Sulfuric Acid", smiles: "O=S(=O)(O)O" },
  { label: "Potassium Carbonate", smiles: "[K+].[K+].[O-]C(=O)[O-]" },
  { label: "Lithium Aluminum Hydride", smiles: "[Li+].[AlH4-]" },
];

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
  const solventSmiles = CONFIG_SOLVENT_SMILES[conditions.solvent] ?? "O";
  const solutionSeedBefore = `${reactants.filter(Boolean).join(".") || ""}+${solventSmiles}${solutes.length ? "+" + solutes.filter(Boolean).join(".") : ""}`;
  const solutionSeedAfter =
    products.length > 0
      ? `${products.join(".")}+${solventSmiles}${solutes.length ? "+" + solutes.filter(Boolean).join(".") : ""}`
      : solutionSeedBefore;

  // Add: derive estimate text using shared helper
  const estimatedMinutes = estimateFromConfig(
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
        commonReactants={CONFIG_COMMON_REACTANTS}
        commonSolutes={CONFIG_COMMON_SOLUTES}
        solventOptions={CONFIG_SOLVENT_OPTIONS}
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
        scoreFromSeed={scoreFromConfig}
      />
    </div>
  );
}