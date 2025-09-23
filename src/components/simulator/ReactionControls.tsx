import { Button } from "@/components/ui/button";
import { Play, Save } from "lucide-react";

type Props = {
  onSimulate: () => void;
  onValidatePubChem: () => void;
  onValidateCheminfo: () => void;
  onNormalizeCheminfo: () => void;
  onSave: () => void;
  canRun: boolean;
  isSimulating: boolean;
  canSave: boolean;
};

export function ReactionControls({
  onSimulate,
  onValidatePubChem,
  onValidateCheminfo,
  onNormalizeCheminfo,
  onSave,
  canRun,
  isSimulating,
  canSave,
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
      <Button variant="outline" onClick={onSave} disabled={!canSave}>
        <Save className="mr-2 h-4 w-4" />
        Save Reaction
      </Button>
    </div>
  );
}
