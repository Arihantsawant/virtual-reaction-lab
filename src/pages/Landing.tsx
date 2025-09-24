import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { 
  Atom, 
  Beaker, 
  ChevronRight, 
  FlaskConical, 
  Shield, 
  Zap,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router";

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const handleWatchDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="ChemSim" className="h-8 w-8" />
              <span className="text-xl font-bold tracking-tight">ChemSim</span>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Button onClick={() => navigate("/dashboard")}>
                  Dashboard
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate("/auth")}>
                    Sign In
                  </Button>
                  <Button onClick={handleGetStarted}>
                    Get Started
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                Virtual Chemical
                <br />
                <span className="text-primary">Simulation Platform</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Simulate, test, and analyze chemical reactions at the molecular level without physical chemicals. 
                Advanced safety analysis and regulatory compliance built-in.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6">
                {isAuthenticated ? "Go to Dashboard" : "Start Simulating"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={handleWatchDemo}>
                Watch Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center space-y-16"
          >
            <div className="space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">
                Revolutionary Chemistry Platform
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need for virtual chemical experimentation and analysis
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Atom,
                  title: "Molecular Simulation",
                  description: "Visualize and manipulate atoms and molecules in real-time 3D environments"
                },
                {
                  icon: Shield,
                  title: "Safety Analysis",
                  description: "Comprehensive safety predictions including toxicity, flammability, and energy release"
                },
                {
                  icon: CheckCircle,
                  title: "Regulatory Compliance",
                  description: "Automated compliance checking against FDA, REACH, OSHA, and other global standards"
                },
                {
                  icon: Beaker,
                  title: "Reaction Prediction",
                  description: "AI-powered prediction of reaction products and pathways with high accuracy"
                },
                {
                  icon: Zap,
                  title: "Real-time Editing",
                  description: "Modify molecular structures and see instant effects on reaction outcomes"
                },
                {
                  icon: FlaskConical,
                  title: "Virtual Laboratory",
                  description: "Complete digital lab environment with no physical chemical requirements"
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                >
                  <Card className="h-full border-0 shadow-none bg-background">
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                        <feature.icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-center text-base leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center space-y-16"
          >
            <div className="space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">
                See ChemSim in Action
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Experience the power of virtual chemical simulation
              </p>
            </div>

            <div className="bg-muted/20 rounded-2xl p-8 md:p-16">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold">Molecular Visualization</h3>
                    <p className="text-muted-foreground">
                      Interactive 3D molecular structures with real-time manipulation capabilities
                    </p>
                  </div>
                  <div className="space-y-3">
                    {[
                      "Real-time 3D rendering",
                      "Atomic-level precision",
                      "Interactive editing tools"
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="lg:col-span-2">
                  <Card className="p-8 bg-background">
                    <div className="flex items-center justify-center h-64">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="relative"
                      >
                        <FlaskConical className="h-32 w-32 text-primary" />
                        <motion.div
                          className="absolute -top-4 -right-4"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Atom className="h-8 w-8 text-blue-500" />
                        </motion.div>
                        <motion.div
                          className="absolute -bottom-4 -left-4"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        >
                          <Atom className="h-8 w-8 text-red-500" />
                        </motion.div>
                      </motion.div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Ready to Transform Your Research?
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of researchers, scientists, and industry professionals using ChemSim 
              to accelerate their chemical research and development.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={handleGetStarted}
              className="text-lg px-8 py-6"
            >
              {isAuthenticated ? "Go to Dashboard" : "Start Free Trial"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="ChemSim" className="h-8 w-8" />
              <span className="text-xl font-bold tracking-tight">ChemSim</span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-muted-foreground">
                © 2024 ChemSim Platform. Built with precision for scientific excellence.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}