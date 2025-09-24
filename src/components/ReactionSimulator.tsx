import { useState } from "react";
import { toast } from "sonner";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ReactionInputs } from "./simulator/ReactionInputs";
import { ReactionVisualization } from "./simulator/ReactionVisualization";
import { ReactionSafetyPanel } from "./simulator/ReactionSafetyPanel";
import { ReactionControls } from "./simulator/ReactionControls";

interface ReactionConditions {
  temperature: number;
  pressure: number;
  solvent: string;
}

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

// Add: simple deterministic estimated time helper
// This is a heuristic for display purposes only
const estimateReactionTimeMinutes = (
  reactantsCount: number,
  solutesCount: number,
  solventKey: string,
  temperatureK: number,
  pressureAtm: number,
) => {
  let base = 30 + reactantsCount * 20 + solutesCount * 10; // base minutes
  // solvent influence (arbitrary weights)
  const solventFactor: Record<string, number> = {
    water: 1.0, ethanol: 0.9, methanol: 0.85, isopropanol: 0.95,
    acetone: 0.8, acetonitrile: 0.75, dmso: 1.1, dmf: 1.15, thf: 0.9,
    dichloromethane: 0.7, chloroform: 0.8, benzene: 1.05, toluene: 1.0,
    xylene: 1.05, dioxane: 0.95, hexane: 1.1, heptane: 1.15, ether: 0.85,
  };
  base *= solventFactor[solventKey] ?? 1.0;
  // temperature: hotter -> faster
  const tempFactor = Math.max(0.4, 1.6 - (temperatureK - 273) / 300);
  // pressure: higher (to a limit) -> slightly faster
  const pressureFactor = Math.max(0.7, 1.2 - (pressureAtm - 1) * 0.05);
  const minutes = Math.max(5, Math.round(base * tempFactor * pressureFactor));
  return minutes;
};

// Add: Solvent options for the Select (labels kept identical to previous UI)
const SOLVENT_OPTIONS: Array<{ key: string; label: string }> = [
  { key: "water", label: "Water" },
  { key: "ethanol", label: "Ethanol" },
  { key: "methanol", label: "Methanol" },
  { key: "isopropanol", label: "Isopropanol" },
  { key: "acetone", label: "Acetone" },
  { key: "acetonitrile", label: "Acetonitrile" },
  { key: "dmso", label: "DMSO" },
  { key: "dmf", label: "DMF" },
  { key: "thf", label: "THF" },
  { key: "dichloromethane", label: "DCM (CH2Cl2)" },
  { key: "chloroform", label: "Chloroform" },
  { key: "benzene", label: "Benzene" },
  { key: "toluene", label: "Toluene" },
  { key: "xylene", label: "Xylene" },
  { key: "dioxane", label: "1,4-Dioxane" },
  { key: "hexane", label: "Hexane" },
  { key: "heptane", label: "Heptane" },
  { key: "ether", label: "Diethyl Ether" },
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