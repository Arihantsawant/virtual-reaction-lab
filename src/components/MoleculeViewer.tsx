import { Card } from "@/components/ui/card";
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface MoleculeViewerProps {
  smiles?: string;
  width?: number;
  height?: number;
  className?: string;
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
    camera.position.set(0, 0, 8);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(2, 3, 4);
    scene.add(dir);

    // Deterministic pseudo "ball-and-stick" layout based on SMILES
    const rand = seededRandom(smiles);
    const atomCount = Math.min(16, Math.max(4, Math.floor(smiles.length / 2)));
    const atomGeo = new THREE.SphereGeometry(0.22, 24, 24);
    const colors = [0x50b5ff, 0xff7369, 0xa0f0b0, 0xffd166, 0xb497ff];

    const positions: Array<THREE.Vector3> = [];
    const atoms: Array<THREE.Mesh> = [];

    for (let i = 0; i < atomCount; i++) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const radius = 1.5 + rand() * 1.2;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      const color = colors[i % colors.length];
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.1 });
      const atom = new THREE.Mesh(atomGeo, mat);
      atom.position.set(x, y, z);
      scene.add(atom);
      atoms.push(atom);
      positions.push(new THREE.Vector3(x, y, z));
    }

    // Bonds between nearby atoms
    const bondMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6, metalness: 0.05 });
    const cylGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 12);
    for (let i = 0; i < atomCount; i++) {
      for (let j = i + 1; j < atomCount; j++) {
        const a = positions[i];
        const b = positions[j];
        const dist = a.distanceTo(b);
        if (dist < 2.2 && dist > 0.35) {
          const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
          const dirVec = new THREE.Vector3().subVectors(b, a);
          const bond = new THREE.Mesh(cylGeo, bondMat);
          bond.position.copy(mid);
          bond.scale.set(1, dist, 1);

          // align cylinder with direction
          bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirVec.clone().normalize());
          scene.add(bond);
        }
      }
    }

    // Slow rotation for a hi-tech feel
    const group = new THREE.Group();
    atoms.forEach((a) => group.add(a));
    scene.add(group);

    let frameId = 0;
    const animate = () => {
      group.rotation.y += 0.003;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const w = width;
      const h = height;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    // Clean up
    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      scene.clear();
      containerRef.current && (containerRef.current.innerHTML = "");
      window.removeEventListener("resize", handleResize);
    };
  }, [smiles, width, height]);

  return (
    <Card className={`p-3 ${className}`}>
      <div
        ref={containerRef}
        className="rounded-lg border bg-muted/10"
        style={{ width, height }}
      />
      <div className="mt-2 text-center">
        <p className="text-xs text-muted-foreground font-mono">{smiles}</p>
      </div>
    </Card>
  );
}