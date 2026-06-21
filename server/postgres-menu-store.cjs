const { Pool } = require("pg");

function createPostgresMenuStore({ connectionString, seed, pool }) {
  const database =
    pool ??
    new Pool({
      connectionString,
      ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
    });
  let initialized;

  async function initialize() {
    if (!initialized) {
      initialized = (async () => {
        await database.query(`
          CREATE TABLE IF NOT EXISTS menu_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            categories JSONB NOT NULL,
            dishes JSONB NOT NULL,
            add_ons JSONB NOT NULL DEFAULT '[]'::jsonb,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);
        await database.query(
          `ALTER TABLE menu_state ADD COLUMN IF NOT EXISTS add_ons JSONB NOT NULL DEFAULT '[]'::jsonb`,
        );
        await database.query(
          `INSERT INTO menu_state (id, categories, dishes, add_ons)
           VALUES (1, $1::jsonb, $2::jsonb, $3::jsonb)
           ON CONFLICT (id) DO NOTHING`,
          [JSON.stringify(seed.categories), JSON.stringify(seed.dishes), JSON.stringify(seed.addOnCatalog ?? [])],
        );
        await database.query(
          `UPDATE menu_state
           SET add_ons = (
             SELECT COALESCE(jsonb_agg(DISTINCT add_on), '[]'::jsonb)
             FROM jsonb_array_elements(dishes) dish,
                  jsonb_array_elements(COALESCE(dish->'addOns', '[]'::jsonb)) add_on
           )
           WHERE id = 1 AND add_ons = '[]'::jsonb`,
        );
      })();
    }
    return initialized;
  }

  async function mutate(change) {
    await initialize();
    const client = await database.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query("SELECT categories, dishes, add_ons FROM menu_state WHERE id = 1 FOR UPDATE");
      const row = result.rows[0];
      const menu = { categories: row.categories, dishes: row.dishes, addOnCatalog: row.add_ons };
      const mutation = change(menu);
      if (!mutation.changed) {
        await client.query("ROLLBACK");
        return mutation.result;
      }
      await client.query(
        `UPDATE menu_state
         SET categories = $1::jsonb, dishes = $2::jsonb, add_ons = $3::jsonb, updated_at = NOW()
         WHERE id = 1`,
        [JSON.stringify(menu.categories), JSON.stringify(menu.dishes), JSON.stringify(menu.addOnCatalog)],
      );
      await client.query("COMMIT");
      return mutation.result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  return {
    kind: "postgres",
    async getMenu() {
      await initialize();
      const result = await database.query("SELECT categories, dishes, add_ons FROM menu_state WHERE id = 1");
      const row = result.rows[0];
      return { categories: row.categories, dishes: row.dishes, addOnCatalog: row.add_ons };
    },
    async createAddOn(addOn) {
      return mutate((menu) => {
        menu.addOnCatalog.push(addOn);
        return { changed: true, result: addOn };
      });
    },
    async updateAddOn(id, addOn) {
      return mutate((menu) => {
        const index = menu.addOnCatalog.findIndex((item) => item.id === id);
        if (index < 0) return { changed: false, result: null };
        const savedAddOn = { id, ...addOn };
        menu.addOnCatalog[index] = savedAddOn;
        menu.dishes = menu.dishes.map((dish) => ({
          ...dish,
          addOns: dish.addOns.map((item) => (item.id === id ? savedAddOn : item)),
        }));
        return { changed: true, result: savedAddOn };
      });
    },
    async deleteAddOn(id) {
      return mutate((menu) => {
        if (!menu.addOnCatalog.some((item) => item.id === id)) return { changed: false, result: false };
        menu.addOnCatalog = menu.addOnCatalog.filter((item) => item.id !== id);
        menu.dishes = menu.dishes.map((dish) => ({
          ...dish,
          addOns: dish.addOns.filter((item) => item.id !== id),
        }));
        return { changed: true, result: true };
      });
    },
    async createCategory(category) {
      return mutate((menu) => {
        menu.categories.push(category);
        return { changed: true, result: category };
      });
    },
    async updateCategory(id, title) {
      return mutate((menu) => {
        const category = menu.categories.find((item) => item.id === id);
        if (!category) return { changed: false, result: null };
        category.title = title;
        return { changed: true, result: category };
      });
    },
    async deleteCategory(id) {
      return mutate((menu) => {
        const categoryExists = menu.categories.some((item) => item.id === id);
        if (!categoryExists) return { changed: false, result: null };
        const deletedDishes = menu.dishes.filter((dish) => dish.categoryId === id);
        const deletedTitles = new Set(deletedDishes.map((dish) => dish.title));
        const deletedDishCount = deletedDishes.length;
        menu.categories = menu.categories.filter((item) => item.id !== id);
        menu.dishes = menu.dishes
          .filter((dish) => dish.categoryId !== id)
          .map((dish) => ({
            ...dish,
            pairings: dish.pairings.filter((title) => !deletedTitles.has(title)),
          }));
        return { changed: true, result: { deletedDishCount } };
      });
    },
    async updateDish(id, dish) {
      return mutate((menu) => {
        const index = menu.dishes.findIndex((item) => item.id === id);
        if (index < 0) return { changed: false, result: null };
        const previousTitle = menu.dishes[index].title;
        menu.dishes[index] = dish;
        if (previousTitle !== dish.title) {
          menu.dishes = menu.dishes.map((item) => ({
            ...item,
            pairings: item.pairings.map((title) => (title === previousTitle ? dish.title : title)),
          }));
        }
        return { changed: true, result: dish };
      });
    },
    async deleteDish(id) {
      return mutate((menu) => {
        const deletedDish = menu.dishes.find((item) => item.id === id);
        if (!deletedDish) return { changed: false, result: false };
        const nextDishes = menu.dishes.filter((item) => item.id !== id);
        menu.dishes = nextDishes.map((dish) => ({
          ...dish,
          pairings: dish.pairings.filter((title) => title !== deletedDish.title),
        }));
        return { changed: true, result: true };
      });
    },
  };
}

module.exports = { createPostgresMenuStore };
