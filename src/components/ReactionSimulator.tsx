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

interface ReactionConditions {
  temperature: number;
  pressure: number;
  solvent: string;
}

const SOLVENT_SMILES: Record<string, string> = {
  water: "O",
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
  const [conditions, setConditions] = useState<ReactionConditions>({
    temperature: 298,
    pressure: 1,
    solvent: "water",
  });
  const [isSimulating, setIsSimulating] = useState(false);

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

  const handleSimulate = async () => {
    const hasAtLeastOneReactant = reactants.some((r) => r.trim().length > 0);
    if (!hasAtLeastOneReactant) {
      toast.error("Add at least one reactant.");
      return;
    }
    setIsSimulating(true);

    await new Promise((resolve) => setTimeout(resolve, 1600));

    // Mock reaction products (deterministic-ish based on inputs)
    const seedBase =
      reactants.join(".") + "|" + solutes.join(".") + "|" + conditions.solvent;
    const productA = reactants[0]?.includes("CCO") ? "CH3CHO" : "CCO";
    const productB = seedBase.includes("O") ? "H2O" : "CO2";

    setProducts([productA, productB]);
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
      {/* Reaction Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Reaction Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reactants & Solvent */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Reactants (SMILES)</Label>
                <div className="flex items-center gap-2">
                  <Select onValueChange={(v) => addReactantFromLibrary(v)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Add from library" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_REACTANTS.map((c) => (
                        <SelectItem key={c.smiles} value={c.smiles}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={addReactant}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Reactant
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {reactants.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Enter SMILES (e.g., CCO)"
                      value={val}
                      onChange={(e) => updateReactant(idx, e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeReactant(idx)}
                      disabled={reactants.length === 1}
                      title="Remove reactant"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Solvent</Label>
              <Select
                value={conditions.solvent}
                onValueChange={(value) =>
                  setConditions((prev) => ({ ...prev, solvent: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="water">Water</SelectItem>
                  <SelectItem value="ethanol">Ethanol</SelectItem>
                  <SelectItem value="methanol">Methanol</SelectItem>
                  <SelectItem value="isopropanol">Isopropanol</SelectItem>
                  <SelectItem value="acetone">Acetone</SelectItem>
                  <SelectItem value="acetonitrile">Acetonitrile</SelectItem>
                  <SelectItem value="dmso">DMSO</SelectItem>
                  <SelectItem value="dmf">DMF</SelectItem>
                  <SelectItem value="thf">THF</SelectItem>
                  <SelectItem value="dichloromethane">DCM (CH2Cl2)</SelectItem>
                  <SelectItem value="chloroform">Chloroform</SelectItem>
                  <SelectItem value="benzene">Benzene</SelectItem>
                  <SelectItem value="toluene">Toluene</SelectItem>
                  <SelectItem value="xylene">Xylene</SelectItem>
                  <SelectItem value="dioxane">1,4-Dioxane</SelectItem>
                  <SelectItem value="hexane">Hexane</SelectItem>
                  <SelectItem value="heptane">Heptane</SelectItem>
                  <SelectItem value="ether">Diethyl Ether</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Solutes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Solutes (optional, SMILES)</Label>
              <div className="flex items-center gap-2">
                <Select onValueChange={(v) => addSoluteFromLibrary(v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Add from library" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_SOLUTES.map((c) => (
                      <SelectItem key={c.smiles} value={c.smiles}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={addSolute}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Solute
                </Button>
              </div>
            </div>
            {solutes.length > 0 && (
              <div className="space-y-2">
                {solutes.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Enter solute SMILES"
                      value={val}
                      onChange={(e) => updateSolute(idx, e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeSolute(idx)}
                      title="Remove solute"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                Temperature: {conditions.temperature}K
              </Label>
              <Slider
                value={[conditions.temperature]}
                onValueChange={([value]) =>
                  setConditions((prev) => ({ ...prev, temperature: value }))
                }
                min={273}
                max={573}
                step={1}
                className="w-full"
              />
            </div>
            <div className="space-y-4">
              <Label>Pressure: {conditions.pressure} atm</Label>
              <Slider
                value={[conditions.pressure]}
                onValueChange={([value]) =>
                  setConditions((prev) => ({ ...prev, pressure: value }))
                }
                min={0.1}
                max={10}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Molecular Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Reactants</h3>
          <MoleculeViewer smiles={reactants.filter(Boolean)[0] || "CCO"} height={220} />
        </div>

        <div className="flex items-center justify-center">
          <motion.div
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ArrowRight className="h-8 w-8 text-primary" />
          </motion.div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Products</h3>
          {products.length > 0 ? (
            <MoleculeViewer smiles={products[0]} height={220} />
          ) : (
            <Card className="p-8 h-[220px] flex items-center justify-center">
              <p className="text-muted-foreground">Run simulation to see products</p>
            </Card>
          )}
        </div>
      </div>

      {/* Additional 3D Views: Solvent & Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Solvent</h3>
          <MoleculeViewer smiles={solventSmiles} height={220} />
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Solution</h3>
          <MoleculeViewer
            smiles={products.length > 0 ? solutionSeedAfter : solutionSeedBefore}
            height={220}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <Button onClick={handleSimulate} disabled={!canRun} className="flex-1">
          <Play className="mr-2 h-4 w-4" />
          {isSimulating ? "Simulating..." : "Run Simulation"}
        </Button>
        <Button variant="outline" onClick={handleSaveReaction} disabled={products.length === 0}>
          <Save className="mr-2 h-4 w-4" />
          Save Reaction
        </Button>
      </div>

      {/* Detailed Safety & Compliance + Applications */}
      {products.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Safety, Environmental Impact & Applications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Percent metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Acute Toxicity", key: "tox" },
                  { label: "Flammability", key: "flamm" },
                  { label: "Reactivity", key: "react" },
                  { label: "Environmental Hazard", key: "env" },
                  { label: "Exposure Risk", key: "exp" },
                  { label: "Corrosivity", key: "corr" },
                ].map((m) => {
                  const val = scoreFromSeed(
                    products.join(".") + "|" + solventSmiles,
                    m.key
                  );
                  return (
                    <div key={m.key} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{m.label}</span>
                        <span className="text-muted-foreground">{val}%</span>
                      </div>
                      <Progress value={val} />
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* Regulatory snapshot */}
              <div className="space-y-2">
                <h4 className="font-medium">Regulatory Compliance Snapshot</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>FDA Status:</span>
                    <span className="text-green-600 font-medium">
                      {scoreFromSeed(products.join("."), "fda") > 50 ? "Permissible" : "Restricted"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>REACH:</span>
                    <span className="text-green-600 font-medium">
                      {scoreFromSeed(products.join("."), "reach") > 50 ? "Compliant" : "Review Needed"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>OSHA:</span>
                    <span className="text-yellow-600 font-medium">
                      {scoreFromSeed(products.join("."), "osha") > 50 ? "Precautions Required" : "Standard"}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Applications */}
              <div className="space-y-3">
                <h4 className="font-medium">Potential Applications</h4>
                <ul className="list-disc pl-6 text-sm space-y-1">
                  <li>Solvent-based synthesis workflows and purification steps</li>
                  <li>Process development and scale-up feasibility studies</li>
                  <li>Analytical reference for QC/QA in manufacturing</li>
                  <li>Intermediate for downstream functionalization</li>
                  <li>Formulation trials for coatings or pharma excipients</li>
                </ul>
                <p className="text-xs text-muted-foreground">
                  Note: Results are simulated and indicative. Validate with lab data prior to industrial deployment.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}