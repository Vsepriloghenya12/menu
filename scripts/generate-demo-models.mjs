import { writeFile } from "node:fs/promises";
import path from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};

const material = (color, roughness = 0.65) => new THREE.MeshStandardMaterial({ color, roughness });

function mesh(geometry, surface, position, rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const object = new THREE.Mesh(geometry, surface);
  object.position.set(...position);
  object.rotation.set(...rotation);
  object.scale.set(...scale);
  return object;
}

function createPlate(scene, color = 0xf2eee5) {
  scene.add(mesh(new THREE.CylinderGeometry(2.65, 2.45, 0.18, 64), material(color, 0.35), [0, -0.16, 0]));
  scene.add(mesh(new THREE.TorusGeometry(2.22, 0.12, 16, 64), material(0xd7d2c8, 0.4), [0, -0.02, 0], [Math.PI / 2, 0, 0]));
}

function createBruschetta() {
  const scene = new THREE.Scene();
  createPlate(scene);
  scene.add(mesh(new THREE.BoxGeometry(3.5, 0.5, 1.65), material(0x8b4e24, 1), [0, 0.25, 0], [0, -0.18, 0]));
  scene.add(mesh(new THREE.BoxGeometry(3.2, 0.38, 1.42), material(0xc88745, 0.9), [0, 0.48, 0], [0, -0.18, 0]));
  [
    [-1.05, 0.84, -0.28],
    [-0.42, 0.88, 0.3],
    [0.25, 0.85, -0.22],
    [0.92, 0.86, 0.25],
  ].forEach((position, index) => {
    scene.add(mesh(new THREE.SphereGeometry(0.32, 24, 16), material(0xd63d2e, 0.72), position, [0, 0, index * 0.35], [1, 0.72, 1]));
    scene.add(mesh(new THREE.SphereGeometry(0.23, 20, 12), material(0x2d7a3c, 0.82), [position[0] + 0.2, 1.08, position[2] - 0.08], [0.2, 0, index], [1.35, 0.18, 0.72]));
  });
  return scene;
}

function createShrimpPasta() {
  const scene = new THREE.Scene();
  createPlate(scene, 0xe8edf0);
  const pasta = material(0xe3b44d, 0.78);
  for (let index = 0; index < 14; index += 1) {
    const angle = (index / 14) * Math.PI * 2;
    const radius = 0.45 + (index % 4) * 0.24;
    scene.add(mesh(new THREE.TorusGeometry(radius, 0.075, 10, 42, Math.PI * 1.55), pasta, [Math.cos(angle) * 0.5, 0.22 + index * 0.025, Math.sin(angle) * 0.42], [Math.PI / 2 + (index % 3) * 0.09, angle, angle * 0.4]));
  }
  [
    [-1.0, 0.62, 0.35, -0.45],
    [0.15, 0.72, -0.65, 1.1],
    [1.05, 0.58, 0.38, 2.3],
  ].forEach(([x, y, z, rotation]) => {
    scene.add(mesh(new THREE.TorusGeometry(0.42, 0.15, 14, 30, Math.PI * 1.35), material(0xf27f59, 0.6), [x, y, z], [Math.PI / 2, rotation, 0]));
  });
  return scene;
}

function createFondant() {
  const scene = new THREE.Scene();
  createPlate(scene, 0xeee9df);
  scene.add(mesh(new THREE.CylinderGeometry(1.22, 1.35, 1.65, 48), material(0x32150f, 0.92), [-0.32, 0.7, 0]));
  scene.add(mesh(new THREE.SphereGeometry(0.62, 32, 20), material(0x7d2416, 0.38), [-0.1, 1.15, 0.72], [0, 0, 0], [1.15, 0.55, 0.75]));
  scene.add(mesh(new THREE.SphereGeometry(0.72, 32, 24), material(0xf4eee2, 0.85), [1.25, 0.62, -0.25], [0, 0, 0], [1, 0.92, 1]));
  scene.add(mesh(new THREE.SphereGeometry(0.2, 20, 14), material(0xa71936, 0.65), [1.2, 1.25, -0.12]));
  return scene;
}

async function exportScene(scene, filename) {
  const result = await new Promise((resolve, reject) => {
    new GLTFExporter().parse(scene, resolve, reject, { binary: true, onlyVisible: true });
  });
  const output = Buffer.from(result);
  await writeFile(path.join(process.cwd(), "assets", "models", filename), output);
  console.log(`${filename}: ${output.byteLength} bytes`);
  return output.toString("base64");
}

const models = {
  bruschetta: await exportScene(createBruschetta(), "Bruschetta.glb"),
  "shrimp-pasta": await exportScene(createShrimpPasta(), "ShrimpPasta.glb"),
  fondant: await exportScene(createFondant(), "ChocolateFondant.glb"),
};

const modelDataSource = `import { DishModelId } from "./dish-models";

export const dishModelData: Record<DishModelId, string> = {
  bruschetta: "data:model/gltf-binary;base64,${models.bruschetta}",
  "shrimp-pasta": "data:model/gltf-binary;base64,${models["shrimp-pasta"]}",
  fondant: "data:model/gltf-binary;base64,${models.fondant}",
};
`;

await writeFile(path.join(process.cwd(), "src", "data", "dish-model-data.ts"), modelDataSource);
