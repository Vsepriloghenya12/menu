const seed = require("./data/seed-menu.json");
const { createMenuStore } = require("./create-menu-store.cjs");

async function main() {
  const store = createMenuStore();
  await store.replaceMenu(seed);
  console.log(
    `Demo menu seeded: ${seed.categories.length} categories, ${seed.dishes.length} dishes, ${seed.addOnCatalog.length} add-ons.`,
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
