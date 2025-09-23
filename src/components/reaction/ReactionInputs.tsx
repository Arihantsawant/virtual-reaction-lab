import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Minus, Plus, Thermometer, Zap } from "lucide-react";
import { MoleculeViewer } from "@/components/MoleculeViewer";

export type ReactionConditions = {
  temperature: number;
  pressure: number;
  solvent: string;
};

type LibraryItem = { label: string; smiles: string };

type Props = {
  reactants: string[];
  solutes: string[];
  conditions: ReactionConditions;

  updateReactant: (idx: number, value: string) => void;
  addReactant: () => void;
  removeReactant: (idx: number) => void;
  addReactantFromLibrary: (smiles: string) => void;

  updateSolute: (idx: number, value: string) => void;
  addSolute: () => void;
  removeSolute: (idx: number) => void;
  addSoluteFromLibrary: (smiles: string) => void;

  setSolvent: (solvent: string) => void;
  setTemperature: (k: number) => void;
  setPressure: (atm: number) => void;

  commonReactants: Array<LibraryItem>;
  commonSolutes: Array<LibraryItem>;
  estimateText: string;
};

export function ReactionInputs({
  reactants,
  solutes,
  conditions,
  updateReactant,
  addReactant,
  removeReactant,
  addReactantFromLibrary,
  updateSolute,
  addSolute,
  removeSolute,
  addSoluteFromLibrary,
  setSolvent,
  setTemperature,
  setPressure,
  commonReactants,
  commonSolutes,
  estimateText,
}: Props) {
  return (
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
                    {commonReactants.map((c) => (
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

            {reactants.filter((r) => r.trim()).length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Reactant Structures</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {reactants
                    .filter((r) => r.trim())
                    .map((r, i) => (
                      <MoleculeViewer key={`${r}-${i}`} smiles={r} height={160} captionMode="formula" />
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label>Solvent</Label>
            <Select value={conditions.solvent} onValueChange={(value) => setSolvent(value)}>
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
                  {commonSolutes.map((c) => (
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
              onValueChange={([value]) => setTemperature(value)}
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
              onValueChange={([value]) => setPressure(value)}
              min={0.1}
              max={10}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        {/* Estimate */}
        <div className="text-sm text-muted-foreground">
          Estimated real-world completion time: <span className="font-medium">{estimateText}</span>
        </div>
      </CardContent>
    </Card>
  );
}
