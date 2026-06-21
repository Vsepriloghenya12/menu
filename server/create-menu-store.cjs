const path = require("node:path");
const seed = require("./data/seed-menu.json");
const { createJsonMenuStore } = require("./json-menu-store.cjs");

function createMenuStore(options = {}) {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;
  if (databaseUrl) {
    const { createPostgresMenuStore } = require("./postgres-menu-store.cjs");
    return createPostgresMenuStore({ connectionString: databaseUrl, seed, pool: options.pool });
  }

  return createJsonMenuStore({
    filePath: options.filePath ?? path.join(__dirname, "data", "local-menu.json"),
    seed,
  });
}

module.exports = { createMenuStore };
