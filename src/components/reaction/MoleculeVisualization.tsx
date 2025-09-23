import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { MoleculeViewer } from "@/components/MoleculeViewer";

type Props = {
  reactants: string[];
  products: string[];
  byproducts: string[];
  solventSmiles: string;
  solutionSeedAfter: string;
};

export function MoleculeVisualization({
  reactants,
  products,
  byproducts,
  solventSmiles,
  solutionSeedAfter,
}: Props) {
  return (
    <>
      {/* Molecular Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Reactants</h3>
          {/* Show first as primary preview to keep layout compact */}
          <MoleculeViewer smiles={reactants.filter(Boolean)[0] || "CCO"} height={220} captionMode="formula" />
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
            <div className="space-y-3">
              {/* Render all primary products */}
              <div className="grid grid-cols-1 gap-3">
                {products.map((p, i) => (
                  <MoleculeViewer key={`prod-${i}-${p}`} smiles={p} height={220} />
                ))}
              </div>
              {/* Byproducts */}
              {byproducts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Byproducts</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {byproducts.map((b, i) => (
                      <MoleculeViewer key={`byprod-${i}-${b}`} smiles={b} height={180} />
                    ))}
                  </div>
                </div>
              )}
            </div>
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
          {products.length > 0 ? (
            <MoleculeViewer
              smiles={solutionSeedAfter}
              height={220}
            />
          ) : (
            <Card className="p-8 h-[220px] flex items-center justify-center">
              <p className="text-muted-foreground">Run simulation to generate solution structure</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
