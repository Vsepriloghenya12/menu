const { mkdir, readFile, rename, writeFile } = require("node:fs/promises");
const path = require("node:path");

function createJsonMenuStore({ filePath, seed }) {
  async function ensureFile() {
    await mkdir(path.dirname(filePath), { recursive: true });
    try {
      await readFile(filePath, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await writeFile(filePath, JSON.stringify(seed, null, 2), "utf8");
    }
  }

  async function readMenu() {
    await ensureFile();
    const menu = JSON.parse(await readFile(filePath, "utf8"));
    if (!Array.isArray(menu.addOnCatalog)) {
      const uniqueAddOns = new Map();
      for (const dish of menu.dishes) {
        for (const addOn of dish.addOns ?? []) {
          uniqueAddOns.set(addOn.id, addOn);
        }
      }
      menu.addOnCatalog = [...uniqueAddOns.values()];
      await writeMenu(menu);
    }
    return menu;
  }

  async function writeMenu(menu) {
    const temporaryPath = `${filePath}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(menu, null, 2), "utf8");
    await rename(temporaryPath, filePath);
  }

  return {
    kind: "json",
    async getMenu() {
      return readMenu();
    },
    async createCategory(category) {
      const menu = await readMenu();
      menu.categories.push(category);
      await writeMenu(menu);
      return category;
    },
    async createAddOn(addOn) {
      const menu = await readMenu();
      menu.addOnCatalog.push(addOn);
      await writeMenu(menu);
      return addOn;
    },
    async updateAddOn(id, addOn) {
      const menu = await readMenu();
      const index = menu.addOnCatalog.findIndex((item) => item.id === id);
      if (index < 0) return null;
      menu.addOnCatalog[index] = { id, ...addOn };
      menu.dishes = menu.dishes.map((dish) => ({
        ...dish,
        addOns: dish.addOns.map((item) => (item.id === id ? { id, ...addOn } : item)),
      }));
      await writeMenu(menu);
      return menu.addOnCatalog[index];
    },
    async deleteAddOn(id) {
      const menu = await readMenu();
      if (!menu.addOnCatalog.some((item) => item.id === id)) return false;
      menu.addOnCatalog = menu.addOnCatalog.filter((item) => item.id !== id);
      menu.dishes = menu.dishes.map((dish) => ({
        ...dish,
        addOns: dish.addOns.filter((item) => item.id !== id),
      }));
      await writeMenu(menu);
      return true;
    },
    async updateCategory(id, title) {
      const menu = await readMenu();
      const category = menu.categories.find((item) => item.id === id);
      if (!category) return null;
      category.title = title;
      await writeMenu(menu);
      return category;
    },
    async deleteCategory(id) {
      const menu = await readMenu();
      const categoryExists = menu.categories.some((item) => item.id === id);
      if (!categoryExists) return null;
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
      await writeMenu(menu);
      return { deletedDishCount };
    },
    async updateDish(id, dish) {
      const menu = await readMenu();
      const index = menu.dishes.findIndex((item) => item.id === id);
      if (index < 0) return null;
      const previousTitle = menu.dishes[index].title;
      menu.dishes[index] = dish;
      if (previousTitle !== dish.title) {
        menu.dishes = menu.dishes.map((item) => ({
          ...item,
          pairings: item.pairings.map((title) => (title === previousTitle ? dish.title : title)),
        }));
      }
      await writeMenu(menu);
      return dish;
    },
    async deleteDish(id) {
      const menu = await readMenu();
      const deletedDish = menu.dishes.find((item) => item.id === id);
      if (!deletedDish) return false;
      const nextDishes = menu.dishes.filter((item) => item.id !== id);
      menu.dishes = nextDishes.map((dish) => ({
        ...dish,
        pairings: dish.pairings.filter((title) => title !== deletedDish.title),
      }));
      await writeMenu(menu);
      return true;
    },
  };
}

module.exports = { createJsonMenuStore };
