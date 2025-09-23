import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

type Props = {
  products: string[];
  solventSmiles: string;
};

// Deterministic pseudo-scores from a seed string
function scoreFromSeed(seed: string, salt: string) {
  let h = 2166136261 >>> 0;
  const s = seed + "|" + salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // map to 5..95 for nicer percentages
  return 5 + (h >>> 0) % 91;
}

export function SafetyApplicationsPanel({ products, solventSmiles }: Props) {
  if (products.length === 0) return null;

  return (
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
  );
}
