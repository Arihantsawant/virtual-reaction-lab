import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus, Minus, Thermometer } from "lucide-react";
import { MoleculeViewer } from "@/components/MoleculeViewer";

export type ReactionConditions = {
  temperature: number;
  pressure: number;
  solvent: string;
};

export type LibraryItem = { label: string; smiles: string };

type ReactionInputsProps = {
  reactants: string[];
  solutes: string[];
  conditions: ReactionConditions;
  commonReactants: LibraryItem[];
  commonSolutes: LibraryItem[];
  solventSmilesMap: Record<string, string>;
  onAddReactant: () => void;
  onRemoveReactant: (idx: number) => void;
  onUpdateReactant: (idx: number, value: string) => void;
  onAddReactantFromLibrary: (smiles: string) => void;
  onAddSolute: () => void;
  onRemoveSolute: (idx: number) => void;
  onUpdateSolute: (idx: number, value: string) => void;
  onAddSoluteFromLibrary: (smiles: string) => void;
  onChangeSolvent: (value: string) => void;
  onChangeTemperature: (value: number) => void;
  onChangePressure: (value: number) => void;
  estimatedText: string;
};

export function ReactionInputs(props: ReactionInputsProps) {
  const {
    reactants,
    solutes,
    conditions,
    commonReactants,
    commonSolutes,
    onAddReactant,
    onRemoveReactant,
    onUpdateReactant,
    onAddReactantFromLibrary,
    onAddSolute,
    onRemoveSolute,
    onUpdateSolute,
    onAddSoluteFromLibrary,
    onChangeSolvent,
    onChangeTemperature,
    onChangePressure,
    estimatedText,
  } = props;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
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
                <Select onValueChange={(v) => onAddReactantFromLibrary(v)}>
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
                <Button variant="outline" size="sm" onClick={onAddReactant}>
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
                    onChange={(e) => onUpdateReactant(idx, e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onRemoveReactant(idx)}
                    disabled={reactants.length === 1}
                    title="Remove reactant"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Live 3D previews for non-empty reactants */}
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
            <Select
              value={conditions.solvent}
              onValueChange={(value) => onChangeSolvent(value)}
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
              <Select onValueChange={(v) => onAddSoluteFromLibrary(v)}>
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
              <Button variant="outline" size="sm" onClick={onAddSolute}>
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
                    onChange={(e) => onUpdateSolute(idx, e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onRemoveSolute(idx)}
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
              onValueChange={([value]) => onChangeTemperature(value)}
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
              onValueChange={([value]) => onChangePressure(value)}
              min={0.1}
              max={10}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        {/* Estimated time */}
        <div className="text-sm text-muted-foreground">
          Estimated real-world completion time: <span className="font-medium">{estimatedText}</span>
        </div>
      </CardContent>
    </Card>
  );
}
