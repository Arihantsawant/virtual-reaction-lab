import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Beaker, FileText, History, LogOut, FlaskConical, Plus, User } from "lucide-react";
import { useNavigate } from "react-router";
import { ReactionSimulator } from "@/components/ReactionSimulator";
import { useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const validateStructure = useAction(api.cheminfo.validateStructure);
  const [showCheminfoWarning, setShowCheminfoWarning] = useState(false);
  const molecules = useQuery(api.molecules.getUserMolecules) ?? [];

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // quick ping to detect missing FASTAPI env setup
        await validateStructure({ structure: "C" });
      } catch (e: any) {
        const msg = String(e?.message || e);
        if (mounted && msg.includes("FASTAPI_CHEM_BASE_URL")) {
          setShowCheminfoWarning(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [validateStructure]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Add: quick test button to validate FastAPI config
  const testCheminfoConnection = async () => {
    try {
      await validateStructure({ structure: "C" });
      toast.success("FastAPI Cheminformatics connected!");
      setShowCheminfoWarning(false);
    } catch (e: any) {
      const msg = String(e?.message || e);
      toast.error(msg.includes("FASTAPI_CHEM_BASE_URL") ? "FASTAPI_CHEM_BASE_URL is not set." : `Cheminfo error: ${msg}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/logo.svg"
                alt="ChemSim"
                className="h-8 w-8 cursor-pointer"
                onClick={() => navigate("/")}
              />
              <h1 className="text-xl font-bold tracking-tight">ChemSim Platform</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span>{user?.name || user?.email || "User"}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Add: Cheminformatics env setup banner */}
        {showCheminfoWarning && (
          <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-900 p-4">
            <div className="font-medium">FastAPI Cheminformatics backend not configured</div>
            <p className="text-sm mt-1">
              Set FASTAPI_CHEM_BASE_URL (and optional FASTAPI_CHEM_API_KEY) in Integrations to enable Cheminfo features.
              After saving, reload the app and use the "Cheminfo: Validate" and "Cheminfo: Normalize" buttons in the Simulator.
            </p>
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={testCheminfoConnection}>
                Test Cheminfo Connection
              </Button>
            </div>
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Tabs defaultValue="simulator" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="simulator" className="flex items-center gap-2">
                <Beaker className="h-4 w-4" />
                Simulator
              </TabsTrigger>
              <TabsTrigger value="molecules" className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                Molecules
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="simulator">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Reaction Simulator</h2>
                    <p className="text-muted-foreground">
                      Design and simulate chemical reactions at the molecular level
                    </p>
                  </div>
                </div>
                <ReactionSimulator />
              </div>
            </TabsContent>

            <TabsContent value="molecules">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Molecule Library</h2>
                    <p className="text-muted-foreground">
                      Manage your saved molecules and their properties
                    </p>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Molecule
                  </Button>
                </div>

                {/* Render user molecules */}
                {molecules.length === 0 ? (
                  <Card className="p-6">
                    <div className="text-sm text-muted-foreground">
                      No molecules yet. Use "Add Molecule" or save from the simulator.
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {molecules.map((m) => (
                      <Card key={m._id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-lg">{m.name}</CardTitle>
                          <CardDescription>{m.formula}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            {m.properties?.molecularWeight !== undefined && (
                              <div className="flex justify-between">
                                <span>Molecular Weight:</span>
                                <span>{m.properties.molecularWeight} g/mol</span>
                              </div>
                            )}
                            {m.properties?.toxicity && (
                              <div className="flex justify-between">
                                <span>Toxicity:</span>
                                <span className="text-green-600">{m.properties.toxicity}</span>
                              </div>
                            )}
                            {m.properties?.hazardLevel && (
                              <div className="flex justify-between">
                                <span>Hazard:</span>
                                <span className="text-yellow-700">{m.properties.hazardLevel}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>SMILES:</span>
                              <span className="font-mono truncate max-w-[10rem]" title={m.smiles}>{m.smiles}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Simulation History</h2>
                  <p className="text-muted-foreground">
                    Review your past simulations and results
                  </p>
                </div>
                
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-medium">Ethanol Oxidation Reaction</h3>
                            <p className="text-sm text-muted-foreground">
                              CCO + [O] → CH₃CHO + H₂O
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Simulated 2 hours ago
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                              Completed
                            </span>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reports">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Compliance Reports</h2>
                    <p className="text-muted-foreground">
                      Generate regulatory and safety compliance reports
                    </p>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Safety Assessment Report</CardTitle>
                      <CardDescription>
                        Comprehensive safety analysis for your reactions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">
                        Generate Safety Report
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Regulatory Compliance</CardTitle>
                      <CardDescription>
                        FDA, REACH, and OSHA compliance status
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">
                        Generate Compliance Report
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}