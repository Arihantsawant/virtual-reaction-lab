import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus, Minus, Thermometer } from "lucide-react";
import { MoleculeViewer } from "@/components/MoleculeViewer";

type LibraryItem = { label: string; smiles: string };
type ReactionConditions = { temperature: number; pressure: number; solvent: string };
type SolventOption = { key: string; label: string };

type Props = {
  reactants: string[];
  setReactants: (next: string[]) => void;
  solutes: string[];
  setSolutes: (next: string[]) => void;
  conditions: ReactionConditions;
  setConditions: (updater: (prev: ReactionConditions) => ReactionConditions) => void;
  commonReactants: Array<LibraryItem>;
  commonSolutes: Array<LibraryItem>;
  solventOptions: Array<SolventOption>;
  estimatedText: string;
  addReactantFromLibrary: (smiles: string) => void;
  addSoluteFromLibrary: (smiles: string) => void;
};

export function ReactionInputs({
  reactants,
  setReactants,
  solutes,
  setSolutes,
  conditions,
  setConditions,
  commonReactants,
  commonSolutes,
  solventOptions,
  estimatedText,
  addReactantFromLibrary,
  addSoluteFromLibrary,
}: Props) {
  const sanitizeSmiles = (input: string) => {
    const allowed = /[A-Za-z0-9@\+\-\[\]\(\)=#\\\/\.\*:]/g;
    const cleaned = (input.match(allowed) || []).join("");
    return cleaned.slice(0, 200);
  };

  const updateReactant = (idx: number, value: string) => {
    const next = [...reactants];
    next[idx] = sanitizeSmiles(value);
    setReactants(next);
  };
  const addReactant = () => setReactants([...reactants, ""]);
  const removeReactant = (idx: number) => setReactants(reactants.filter((_, i) => i !== idx));

  const updateSolute = (idx: number, value: string) => {
    const next = [...solutes];
    next[idx] = sanitizeSmiles(value);
    setSolutes(next);
  };
  const addSolute = () => setSolutes([...solutes, ""]);
  const removeSolute = (idx: number) => setSolutes(solutes.filter((_, i) => i !== idx));

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
              onValueChange={(value) =>
                setConditions((prev) => ({ ...prev, solvent: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {solventOptions.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
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

        {/* Estimated time */}
        <div className="text-sm text-muted-foreground">
          Estimated real-world completion time: <span className="font-medium">{estimatedText}</span>
        </div>
      </CardContent>
    </Card>
  );
}
