export type ReactionConditions = {
  temperature: number;
  pressure: number;
  solvent: string;
};

export const SOLVENT_SMILES: Record<string, string> = {
  water: "[H]O[H]",
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

export const COMMON_REACTANTS: Array<{ label: string; smiles: string }> = [
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

export const COMMON_SOLUTES: Array<{ label: string; smiles: string }> = [
  { label: "Sodium Chloride", smiles: "[Na+].[Cl-]" },
  { label: "Sodium Hydroxide", smiles: "[Na+].[OH-]" },
  { label: "Hydrochloric Acid", smiles: "Cl" },
  { label: "Sulfuric Acid", smiles: "O=S(=O)(O)O" },
  { label: "Potassium Carbonate", smiles: "[K+].[K+].[O-]C(=O)[O-]" },
  { label: "Lithium Aluminum Hydride", smiles: "[Li+].[AlH4-]" },
];

export const SOLVENT_OPTIONS: Array<{ key: string; label: string }> = [
  { key: "water", label: "Water" },
  { key: "ethanol", label: "Ethanol" },
  { key: "methanol", label: "Methanol" },
  { key: "isopropanol", label: "Isopropanol" },
  { key: "acetone", label: "Acetone" },
  { key: "acetonitrile", label: "Acetonitrile" },
  { key: "dmso", label: "DMSO" },
  { key: "dmf", label: "DMF" },
  { key: "thf", label: "THF" },
  { key: "dichloromethane", label: "DCM (CH2Cl2)" },
  { key: "chloroform", label: "Chloroform" },
  { key: "benzene", label: "Benzene" },
  { key: "toluene", label: "Toluene" },
  { key: "xylene", label: "Xylene" },
  { key: "dioxane", label: "1,4-Dioxane" },
  { key: "hexane", label: "Hexane" },
  { key: "heptane", label: "Heptane" },
  { key: "ether", label: "Diethyl Ether" },
];

// Simple heuristic estimated time helper
export const estimateReactionTimeMinutes = (
  reactantsCount: number,
  solutesCount: number,
  solventKey: string,
  temperatureK: number,
  pressureAtm: number,
) => {
  let base = 30 + reactantsCount * 20 + solutesCount * 10; // base minutes
  const solventFactor: Record<string, number> = {
    water: 1.0,
    ethanol: 0.9,
    methanol: 0.85,
    isopropanol: 0.95,
    acetone: 0.8,
    acetonitrile: 0.75,
    dmso: 1.1,
    dmf: 1.15,
    thf: 0.9,
    dichloromethane: 0.7,
    chloroform: 0.8,
    benzene: 1.05,
    toluene: 1.0,
    xylene: 1.05,
    dioxane: 0.95,
    hexane: 1.1,
    heptane: 1.15,
    ether: 0.85,
  };
  base *= solventFactor[solventKey] ?? 1.0;
  const tempFactor = Math.max(0.4, 1.6 - (temperatureK - 273) / 300);
  const pressureFactor = Math.max(0.7, 1.2 - (pressureAtm - 1) * 0.05);
  const minutes = Math.max(5, Math.round(base * tempFactor * pressureFactor));
  return minutes;
};
