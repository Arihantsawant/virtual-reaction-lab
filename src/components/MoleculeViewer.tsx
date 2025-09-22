import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Atom, Beaker } from "lucide-react";
import { useEffect, useRef } from "react";

interface MoleculeViewerProps {
  smiles?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function MoleculeViewer({ 
  smiles = "CCO", 
  width = 400, 
  height = 300,
  className = ""
}: MoleculeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In a real implementation, this would integrate with a molecular viewer library
    // like 3Dmol.js or NGL Viewer to render the actual molecule structure
    console.log("Rendering molecule:", smiles);
  }, [smiles]);

  return (
    <Card className={`p-8 ${className}`}>
      <div 
        ref={containerRef}
        className="flex items-center justify-center bg-muted/20 rounded-lg"
        style={{ width, height }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Beaker className="h-16 w-16 text-primary" />
            </motion.div>
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Atom className="h-6 w-6 text-blue-500" />
            </motion.div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Molecule Structure</p>
            <p className="text-xs text-muted-foreground font-mono">{smiles}</p>
          </div>
        </motion.div>
      </div>
    </Card>
  );
}
