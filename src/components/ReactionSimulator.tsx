import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import { ArrowRight, Play, Save, Thermometer, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MoleculeViewer } from "./MoleculeViewer";

interface ReactionConditions {
  temperature: number;
  pressure: number;
  solvent: string;
}

const SOLVENT_SMILES: Record<string, string> = {
  water: "O",
  ethanol: "CCO",
  acetone: "CC(C)=O",
  dmso: "CS(=O)C",
};

export function ReactionSimulator() {
  const [reactants, setReactants] = useState<string[]>(["CCO"]);
  const [products, setProducts] = useState<string[]>([]);
  const [conditions, setConditions] = useState<ReactionConditions>({
    temperature: 298,
    pressure: 1,
    solvent: "water"
  });
  const [isSimulating, setIsSimulating] = useState(false);

  const sanitizeSmiles = (input: string) => {
    const allowed = /[A-Za-z0-9@+\-\[\]\(\)=#\\/\.]/g;
    const cleaned = (input.match(allowed) || []).join("");
    return cleaned.slice(0, 200);
  };

  // Derived SMILES for solvent and solution previews
  const solventSmiles = SOLVENT_SMILES[conditions.solvent] ?? "O";
  const solutionSeedBefore = `${reactants[0] || ""}+${solventSmiles}`;
  const solutionSeedAfter =
    products.length > 0 ? `${products.join(".")}+${solventSmiles}` : solutionSeedBefore;

  const handleSimulate = async () => {
    setIsSimulating(true);
    
    // Simulate reaction processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock reaction products
    setProducts(["CCO", "H2O"]);
    setIsSimulating(false);
    
    toast.success("Reaction simulation completed!");
  };

  const handleSaveReaction = () => {
    toast.success("Reaction saved to your library!");
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label>Reactants (SMILES)</Label>
              <Input
                placeholder="Enter SMILES notation (e.g., CCO)"
                value={reactants[0] || ""}
                onChange={(e) => setReactants([sanitizeSmiles(e.target.value)])}
              />
            </div>
            <div className="space-y-4">
              <Label>Solvent</Label>
              <Select value={conditions.solvent} onValueChange={(value) => 
                setConditions(prev => ({ ...prev, solvent: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="water">Water</SelectItem>
                  <SelectItem value="ethanol">Ethanol</SelectItem>
                  <SelectItem value="acetone">Acetone</SelectItem>
                  <SelectItem value="dmso">DMSO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                Temperature: {conditions.temperature}K
              </Label>
              <Slider
                value={[conditions.temperature]}
                onValueChange={([value]) => 
                  setConditions(prev => ({ ...prev, temperature: value }))
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
                  setConditions(prev => ({ ...prev, pressure: value }))
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
          <MoleculeViewer smiles={reactants[0]} height={220} />
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
          <MoleculeViewer smiles={products.length > 0 ? solutionSeedAfter : solutionSeedBefore} height={220} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <Button 
          onClick={handleSimulate} 
          disabled={isSimulating || !reactants[0]}
          className="flex-1"
        >
          <Play className="mr-2 h-4 w-4" />
          {isSimulating ? "Simulating..." : "Run Simulation"}
        </Button>
        <Button 
          variant="outline" 
          onClick={handleSaveReaction}
          disabled={products.length === 0}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Reaction
        </Button>
      </div>

      {/* Safety Analysis */}
      {products.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Safety & Compliance Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Toxicity</p>
                  <p className="text-lg font-bold text-green-600">Low</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">Flammability</p>
                  <p className="text-lg font-bold text-yellow-600">Moderate</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Energy Release</p>
                  <p className="text-lg font-bold text-blue-600">-45 kJ/mol</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-medium">Regulatory Compliance</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>FDA Status:</span>
                    <span className="text-green-600 font-medium">Approved</span>
                  </div>
                  <div className="flex justify-between">
                    <span>REACH:</span>
                    <span className="text-green-600 font-medium">Compliant</span>
                  </div>
                  <div className="flex justify-between">
                    <span>OSHA:</span>
                    <span className="text-yellow-600 font-medium">Review Required</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}