import { Card } from "@/components/ui/card";
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface MoleculeViewerProps {
  smiles?: string;
  width?: number;
  height?: number;
  className?: string;
}

// Add: element color palette and simple SMILES parsing utilities
const ELEMENT_COLORS: Record<string, number> = {
  H: 0xffffff,
  He: 0xd9ffff,
  Li: 0xcc80ff,
  Be: 0xc2ff00,
  B: 0xffb5b5,
  C: 0x4f9cf7,
  N: 0x7fd1ae,
  O: 0xff6b6b,
  F: 0x64e1a1,
  Ne: 0xb3e3f5,
  Na: 0xab5cf2,
  Mg: 0x8aff00,
  Al: 0xbfa6a6,
  Si: 0xf0c8a0,
  P: 0xffa5ab,
  S: 0xffc857,
  Cl: 0x6bd1ff,
  Ar: 0x80d1e3,
  K: 0x8f40d4,
  Ca: 0x3dff00,
  Sc: 0xe6e6e6,
  Ti: 0xbfc2c7,
  V: 0xa6a6ab,
  Cr: 0x8a99c7,
  Mn: 0x9c7ac7,
  Fe: 0xe06633,
  Co: 0xf090a0,
  Ni: 0x50d050,
  Cu: 0xc88033,
  Zn: 0x7d80b0,
  Ga: 0xc28f8f,
  Ge: 0x668f8f,
  As: 0xbd80e3,
  Se: 0xffa100,
  Br: 0xff9f66,
  Kr: 0x5cb8d1,
  Rb: 0x702eb0,
  Sr: 0x00ff00,
  Y: 0x94ffff,
  Zr: 0x94e0e0,
  Nb: 0x73c2c9,
  Mo: 0x54b5b5,
  Tc: 0x3b9e9e,
  Ru: 0x248f8f,
  Rh: 0x0a7d8c,
  Pd: 0x006985,
  Ag: 0xc0c0c0,
  Cd: 0xffd98f,
  In: 0xa67573,
  Sn: 0x668080,
  Sb: 0x9e63b5,
  Te: 0xd47a00,
  I: 0xc792ea,
  Xe: 0x429eb0,
  Cs: 0x57178f,
  Ba: 0x00c900,
  La: 0x70d4ff,
  Ce: 0xffffc7,
};
const elementName: Record<string, string> = {
  H: "Hydrogen",
  He: "Helium",
  Li: "Lithium",
  Be: "Beryllium",
  B: "Boron",
  C: "Carbon",
  N: "Nitrogen",
  O: "Oxygen",
  F: "Fluorine",
  Ne: "Neon",
  Na: "Sodium",
  Mg: "Magnesium",
  Al: "Aluminum",
  Si: "Silicon",
  P: "Phosphorus",
  S: "Sulfur",
  Cl: "Chlorine",
  Ar: "Argon",
  K: "Potassium",
  Ca: "Calcium",
  Sc: "Scandium",
  Ti: "Titanium",
  V: "Vanadium",
  Cr: "Chromium",
  Mn: "Manganese",
  Fe: "Iron",
  Co: "Cobalt",
  Ni: "Nickel",
  Cu: "Copper",
  Zn: "Zinc",
  Ga: "Gallium",
  Ge: "Germanium",
  As: "Arsenic",
  Se: "Selenium",
  Br: "Bromine",
  Kr: "Krypton",
  Rb: "Rubidium",
  Sr: "Strontium",
  Y: "Yttrium",
  Zr: "Zirconium",
  Nb: "Niobium",
  Mo: "Molybdenum",
  Tc: "Technetium",
  Ru: "Ruthenium",
  Rh: "Rhodium",
  Pd: "Palladium",
  Ag: "Silver",
  Cd: "Cadmium",
  In: "Indium",
  Sn: "Tin",
  Sb: "Antimony",
  Te: "Tellurium",
  I: "Iodine",
  Xe: "Xenon",
  Cs: "Cesium",
  Ba: "Barium",
  La: "Lanthanum",
  Ce: "Cerium",
};
function parseElementsFromSmiles(smiles: string): string[] {
  // Prioritize multi-letter halogens, then generic element tokens
  const tokens = smiles.match(/Cl|Br|[A-Z][a-z]?/g) || [];
  return tokens;
}
function computeFormula(elements: string[]): string {
  if (!elements.length) return "";
  const counts: Record<string, number> = {};
  for (const el of elements) counts[el] = (counts[el] || 0) + 1;
  // Hill system: C then H then alphabetical
  const keys = Object.keys(counts);
  const ordered: string[] = [];
  if (counts["C"]) {
    ordered.push("C");
    delete counts["C"];
    if (counts["H"]) {
      ordered.push("H");
      delete counts["H"];
    }
  }
  const rest = Object.keys(counts).sort();
  const finalKeys = ordered.concat(rest);
  return finalKeys.map((k) => `${k}${counts[k] > 1 ? counts[k] : ""}`).join("");
}

// Deterministic PRNG from string seed (smiles)
function seededRandom(seed: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    // xorshift32
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1_000_000) / 1_000_000;
  };
}

export function MoleculeViewer({
  smiles = "CCO",
  width = 400,
  height = 300,
  className = "",
}: MoleculeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 10);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(3, 4, 5);
    scene.add(dir);

    // Parse atoms from SMILES; fallback to deterministic pseudo layout if none found
    const parsedAtoms: string[] = parseElementsFromSmiles(smiles);
    const usingParsed = parsedAtoms.length > 0;

    // Deterministic pseudo layout support
    function seededRandom(seed: string) {
      let h = 2166136261 >>> 0;
      for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return () => {
        h ^= h << 13;
        h ^= h >>> 17;
        h ^= h << 5;
        return ((h >>> 0) % 1_000_000) / 1_000_000;
      };
    }
    const rand = seededRandom(smiles);

    // Create atoms
    const atoms: Array<THREE.Mesh> = [];
    const positions: Array<THREE.Vector3> = [];
    const atomGeo = new THREE.SphereGeometry(0.24, 24, 24);

    const atomElements: string[] = usingParsed
      ? parsedAtoms
      : // heuristic: infer approximate atom count if no tokens parsed
        Array.from({ length: Math.min(16, Math.max(4, Math.floor(smiles.length / 2))) }, () => "C");

    // Place atoms in a rough sphere with deterministic randomness
    for (let i = 0; i < atomElements.length; i++) {
      const el = atomElements[i];
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const radius = 1.5 + rand() * 1.3;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      const color = ELEMENT_COLORS[el] ?? 0xb6c2cf;
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.1 });
      const atom = new THREE.Mesh(atomGeo, mat);
      atom.position.set(x, y, z);
      scene.add(atom);
      atoms.push(atom);
      positions.push(new THREE.Vector3(x, y, z));
    }

    // Bonds between nearby atoms (distance threshold), plus simple chain bonds when parsed
    const bondMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6, metalness: 0.05 });
    const cylGeo = new THREE.CylinderGeometry(0.06, 0.06, 1, 12);
    const bonds: THREE.Mesh[] = [];

    // If parsed, ensure sequential bonds exist for a minimal backbone
    if (atomElements.length >= 2) {
      for (let i = 0; i < atomElements.length - 1; i++) {
        const a = positions[i];
        const b = positions[i + 1];
        const dist = a.distanceTo(b);
        const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
        const dirVec = new THREE.Vector3().subVectors(b, a);
        const bond = new THREE.Mesh(cylGeo, bondMat);
        bond.position.copy(mid);
        bond.scale.set(1, dist, 1);
        bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirVec.clone().normalize());
        scene.add(bond);
        bonds.push(bond);
      }
    }

    // Proximity-based bonds to fill structure
    for (let i = 0; i < atomElements.length; i++) {
      for (let j = i + 1; j < atomElements.length; j++) {
        const a = positions[i];
        const b = positions[j];
        const dist = a.distanceTo(b);
        if (dist < 2.3 && dist > 0.35) {
          const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
          const dirVec = new THREE.Vector3().subVectors(b, a);
          const bond = new THREE.Mesh(cylGeo, bondMat);
          bond.position.copy(mid);
          bond.scale.set(1, dist, 1);
          bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirVec.clone().normalize());
          scene.add(bond);
          bonds.push(bond);
        }
      }
    }

    // Group for rotation
    const group = new THREE.Group();
    atoms.forEach((a) => group.add(a));
    bonds.forEach((b) => group.add(b));
    scene.add(group);

    // Interactions: drag to rotate, wheel to zoom
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let targetDist = 10;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
      group.rotation.y += dx * 0.005;
      group.rotation.x += dy * 0.005;
    };
    const onMouseUp = () => {
      isDragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      targetDist = THREE.MathUtils.clamp(targetDist + (e.deltaY > 0 ? 0.8 : -0.8), 4, 24);
    };

    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: true });

    // Animate
    let frameId = 0;
    const animate = () => {
      // subtle idle rotation
      group.rotation.y += 0.0015;
      // smooth zoom
      camera.position.z += (targetDist - camera.position.z) * 0.08;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    // Resize
    const handleResize = () => {
      const w = width;
      const h = height;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      cancelAnimationFrame(frameId);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      scene.clear();
      containerRef.current && (containerRef.current.innerHTML = "");
    };
  }, [smiles, width, height]);

  return (
    <Card className={`p-3 ${className}`}>
      <div
        ref={containerRef}
        className="rounded-lg border bg-muted/10"
        style={{ width, height }}
        title="Drag to rotate • Scroll to zoom"
      />
      <div className="mt-2 text-center space-y-1">
        <p className="text-xs text-muted-foreground font-mono">{smiles}</p>
        {/* Atom legend and formula */}
        <MoleculeLegend smiles={smiles} />
      </div>
    </Card>
  );
}

// Add: Lightweight legend component inline for clarity and reuse
function MoleculeLegend({ smiles }: { smiles: string }) {
  const elements = parseElementsFromSmiles(smiles);
  const counts: Record<string, number> = {};
  for (const el of (elements.length ? elements : ["C", "H", "O"])) {
    counts[el] = (counts[el] || 0) + 1;
  }
  const formula = computeFormula(elements);

  const sorted = Object.keys(counts).sort((a, b) => a.localeCompare(b));
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-xs text-muted-foreground">
        {formula && <span className="font-semibold mr-2">Formula:</span>}
        <span className="font-mono">{formula || "—"}</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {sorted.map((el) => (
          <span key={el} className="inline-flex items-center gap-1 text-xs">
            <span
              className="inline-block rounded-full"
              style={{
                width: 8,
                height: 8,
                backgroundColor: `#${(ELEMENT_COLORS[el] ?? 0xb6c2cf).toString(16).padStart(6, "0")}`,
              }}
            />
            <span className="font-medium">{el}</span>
            <span className="text-muted-foreground">
              {elementName[el] ? `(${elementName[el]})` : ""}
            </span>
            <span className="font-mono ml-1">×{counts[el]}</span>
          </span>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground/80">Drag to rotate • Scroll to zoom</div>
    </div>
  );
}