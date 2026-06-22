const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.join(__dirname, "..", "..");

async function readProjectFile(relativePath) {
  return readFile(path.join(projectRoot, relativePath), "utf8");
}

test("video pager renders video pages separately from the fixed menu overlay", async () => {
  const source = await readProjectFile("src/components/tablet-video-menu.tsx");

  assert.match(source, /renderItem=\{\(\{ item \}\) => <DishVideoPage dish=\{item\}/);
  assert.match(source, /<View pointerEvents="box-none" style=\{styles\.fixedOverlay\}>/);
});

test("client uses the full gastronomic pairings label", async () => {
  const source = await readProjectFile("src/components/tablet-video-menu.tsx");

  assert.doesNotMatch(source, />Подойдет</);
  assert.match(source, />Гастрономические пары</);
});

test("three demo dishes have registered 3D models", async () => {
  const source = await readProjectFile("src/data/dish-models.ts");

  assert.match(source, /bruschetta:/);
  assert.match(source, /"shrimp-pasta":/);
  assert.match(source, /fondant:/);
});

test("video swiping does not trigger a second scrollToIndex effect", async () => {
  const source = await readProjectFile("src/components/tablet-video-menu.tsx");

  assert.doesNotMatch(source, /\[activeDishId,\s*visibleDishes,\s*width\]/);
});

test("action dock keeps a stable third slot for dishes without a 3D model", async () => {
  const source = await readProjectFile("src/components/tablet-video-menu.tsx");

  assert.match(source, /styles\.modelButtonPlaceholder/);
});

test("3D models are embedded as data URIs for the Android WebView", async () => {
  const source = await readProjectFile("src/data/dish-model-data.ts");

  assert.equal((source.match(/data:model\/gltf-binary;base64,/g) ?? []).length, 3);
});

test("3D viewer renders with Three.js and rotates automatically", async () => {
  const source = await readProjectFile("src/components/dish-model-viewer.tsx");

  assert.match(source, /new THREE\.WebGLRenderer/);
  assert.match(source, /controls\.autoRotate = true/);
  assert.match(source, /controls\.autoRotateSpeed/);
  assert.match(source, /horizontalFov/);
  assert.match(source, /fitDistance/);
  assert.doesNotMatch(source, /React\.createElement\("model-viewer"/);
});

test("Android 3D viewer uses native Expo GL instead of a WebView", async () => {
  const source = await readProjectFile("src/components/dish-model-viewer.native.tsx");

  assert.match(source, /@react-three\/fiber\/native/);
  assert.match(source, /expo-gl/);
  assert.doesNotMatch(source, /use dom/);
});
