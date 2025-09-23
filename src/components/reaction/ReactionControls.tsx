import { Button } from "@/components/ui/button";
import { Save, Play } from "lucide-react";

type Props = {
  isSimulating: boolean;
  canRun: boolean;
  hasProducts: boolean;
  onSimulate: () => void;
  onValidatePubChem: () => void;
  onValidateCheminfo: () => void;
  onNormalizeCheminfo: () => void;
  onSave: () => void;
};

export function ReactionControls({
  isSimulating,
  canRun,
  hasProducts,
  onSimulate,
  onValidatePubChem,
  onValidateCheminfo,
  onNormalizeCheminfo,
  onSave,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      <Button onClick={onSimulate} disabled={!canRun} className="flex-1">
        <Play className="mr-2 h-4 w-4" />
        {isSimulating ? "Simulating..." : "Run Simulation"}
      </Button>
      <Button variant="outline" onClick={onValidatePubChem}>
        Validate via PubChem
      </Button>
      <Button variant="outline" onClick={onValidateCheminfo}>
        Cheminfo: Validate
      </Button>
      <Button variant="outline" onClick={onNormalizeCheminfo}>
        Cheminfo: Normalize
      </Button>
      <Button variant="outline" onClick={onSave} disabled={!hasProducts}>
        <Save className="mr-2 h-4 w-4" />
        Save Reaction
      </Button>
    </div>
  );
}
