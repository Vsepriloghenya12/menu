const assert = require("node:assert/strict");
const { mkdtemp, readFile, rm, writeFile } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { createApp } = require("../app.cjs");
const { createMenuStore } = require("../create-menu-store.cjs");
const { createJsonMenuStore } = require("../json-menu-store.cjs");

const seed = {
  categories: [{ id: "hot", title: "Горячее" }],
  addOnCatalog: [
    { id: "cheese", title: "Сыр", price: 90 },
    { id: "sauce", title: "Соус", price: 60 },
  ],
  dishes: [
    {
      id: "pasta",
      categoryId: "hot",
      title: "Паста",
      price: 700,
      videoUrl: "https://example.com/pasta.mp4",
      shortDescription: "Сливочная паста",
      composition: ["паста", "сливки"],
      nutrition: { calories: 500, protein: 20, fat: 15, carbs: 60 },
      story: "Горячее блюдо",
      addOns: [{ id: "cheese", title: "Сыр", price: 90 }],
      pairings: ["Лимонад"],
    },
  ],
};

async function withServer(run, options = {}) {
  const directory = await mkdtemp(path.join(tmpdir(), "video-menu-"));
  const filePath = path.join(directory, "menu.json");
  await writeFile(filePath, JSON.stringify(seed), "utf8");
  const store = createJsonMenuStore({ filePath, seed });
  const videoStorage =
    options.videoStorage ??
    {
      async upload() {
        throw new Error("Video storage not configured");
      },
      async remove() {},
      async getPlaybackUrl() {
        return null;
      },
    };
  const app = createApp({ store, videoStorage, distPath: path.join(directory, "missing-dist") });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run({ baseUrl, filePath });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await rm(directory, { recursive: true, force: true });
  }
}

test("GET /api/menu returns categories and dishes", async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/menu`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), seed);
  });
});

test("GET /api/menu does not expose a Допы category", async () => {
  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/menu`);
    const menu = await response.json();
    assert.equal(menu.categories.some((category) => category.title === "Допы"), false);
  });
});

test("JSON store can replace the complete menu", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "video-menu-replace-"));
  const filePath = path.join(directory, "menu.json");
  const store = createJsonMenuStore({ filePath, seed });
  const nextMenu = {
    categories: [{ id: "desserts", title: "Десерты" }],
    addOnCatalog: [],
    dishes: [],
  };

  try {
    await store.replaceMenu(nextMenu);
    assert.deepEqual(JSON.parse(await readFile(filePath, "utf8")), nextMenu);
    assert.deepEqual(await store.getMenu(), nextMenu);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("PATCH /api/admin/dishes/:id persists a complete valid dish", async () => {
  await withServer(async ({ baseUrl, filePath }) => {
    const changedDish = { ...seed.dishes[0], title: "Паста с креветками", price: 890 };
    const response = await fetch(`${baseUrl}/api/admin/dishes/pasta`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(changedDish),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), changedDish);
    const persisted = JSON.parse(await readFile(filePath, "utf8"));
    assert.deepEqual(persisted.dishes[0], changedDish);
  });
});

test("PATCH dish title updates its name in pairings of other dishes", async () => {
  await withServer(async ({ baseUrl, filePath }) => {
    const menu = JSON.parse(await readFile(filePath, "utf8"));
    menu.dishes.push({
      ...menu.dishes[0],
      id: "lemonade",
      title: "Лимонад",
      pairings: ["Паста"],
    });
    await writeFile(filePath, JSON.stringify(menu), "utf8");
    const changedDish = { ...menu.dishes[0], title: "Паста с креветками" };

    const response = await fetch(`${baseUrl}/api/admin/dishes/pasta`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(changedDish),
    });

    assert.equal(response.status, 200);
    const persisted = JSON.parse(await readFile(filePath, "utf8"));
    assert.deepEqual(persisted.dishes.find((dish) => dish.id === "lemonade").pairings, ["Паста с креветками"]);
  });
});

test("PATCH rejects an empty title without changing storage", async () => {
  await withServer(async ({ baseUrl, filePath }) => {
    const response = await fetch(`${baseUrl}/api/admin/dishes/pasta`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...seed.dishes[0], title: " " }),
    });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.code, "VALIDATION_ERROR");
    assert.equal(body.fields.title, "Укажите название");
    assert.deepEqual(JSON.parse(await readFile(filePath, "utf8")), seed);
  });
});

test("DELETE /api/admin/dishes/:id removes the dish", async () => {
  await withServer(async ({ baseUrl, filePath }) => {
    const response = await fetch(`${baseUrl}/api/admin/dishes/pasta`, { method: "DELETE" });
    assert.equal(response.status, 204);
    const persisted = JSON.parse(await readFile(filePath, "utf8"));
    assert.deepEqual(persisted.dishes, []);
  });
});

test("POST /api/admin/categories creates a group", async () => {
  await withServer(async ({ baseUrl, filePath }) => {
    const response = await fetch(`${baseUrl}/api/admin/categories`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Десерты" }),
    });

    assert.equal(response.status, 201);
    const category = await response.json();
    assert.equal(category.title, "Десерты");
    assert.ok(category.id);
    const persisted = JSON.parse(await readFile(filePath, "utf8"));
    assert.deepEqual(persisted.categories.at(-1), category);
  });
});

test("PATCH /api/admin/categories/:id renames a group", async () => {
  await withServer(async ({ baseUrl, filePath }) => {
    const response = await fetch(`${baseUrl}/api/admin/categories/hot`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Основные блюда" }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { id: "hot", title: "Основные блюда" });
    const persisted = JSON.parse(await readFile(filePath, "utf8"));
    assert.equal(persisted.categories[0].title, "Основные блюда");
  });
});

test("DELETE /api/admin/categories/:id removes the group and all of its dishes", async () => {
  await withServer(async ({ baseUrl, filePath }) => {
    const response = await fetch(`${baseUrl}/api/admin/categories/hot`, { method: "DELETE" });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { deletedDishCount: 1 });
    const persisted = JSON.parse(await readFile(filePath, "utf8"));
    assert.deepEqual(persisted.categories, []);
    assert.deepEqual(persisted.dishes, []);
  });
});

test("admin can create, edit, and delete an add-on catalog position", async () => {
  await withServer(async ({ baseUrl, filePath }) => {
    let response = await fetch(`${baseUrl}/api/admin/add-ons`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Халапеньо", price: 80 }),
    });
    assert.equal(response.status, 201);
    let addOn = await response.json();

    response = await fetch(`${baseUrl}/api/admin/add-ons/${addOn.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Халапеньо острый", price: 100 }),
    });
    assert.equal(response.status, 200);
    addOn = await response.json();
    assert.equal(addOn.title, "Халапеньо острый");
    assert.equal(addOn.price, 100);

    response = await fetch(`${baseUrl}/api/admin/add-ons/${addOn.id}`, { method: "DELETE" });
    assert.equal(response.status, 204);
    const persisted = JSON.parse(await readFile(filePath, "utf8"));
    assert.equal(persisted.addOnCatalog.some((item) => item.id === addOn.id), false);
  });
});

test("deleting an add-on catalog position removes it from dishes", async () => {
  await withServer(async ({ baseUrl, filePath }) => {
    const response = await fetch(`${baseUrl}/api/admin/add-ons/cheese`, { method: "DELETE" });
    assert.equal(response.status, 204);
    const persisted = JSON.parse(await readFile(filePath, "utf8"));
    assert.deepEqual(persisted.dishes[0].addOns, []);
  });
});

test("POST /api/admin/dishes/:id/video uploads a video and updates the dish", async () => {
  const calls = [];
  const videoStorage = {
    async upload(file) {
      calls.push(["upload", file.originalname, file.mimetype]);
      return "dishes/pasta/new-video.mp4";
    },
    async remove(key) {
      calls.push(["remove", key]);
    },
    async getPlaybackUrl() {
      return null;
    },
  };

  await withServer(async ({ baseUrl, filePath }) => {
    const menu = JSON.parse(await readFile(filePath, "utf8"));
    menu.dishes[0].videoUrl = "managed-video://dishes/pasta/old-video.mp4";
    await writeFile(filePath, JSON.stringify(menu), "utf8");
    const form = new FormData();
    form.append("video", new Blob(["video"], { type: "video/mp4" }), "pasta.mp4");
    const response = await fetch(`${baseUrl}/api/admin/dishes/pasta/video`, {
      method: "POST",
      body: form,
    });

    assert.equal(response.status, 200);
    const dish = await response.json();
    assert.equal(dish.videoUrl, "managed-video://dishes/pasta/new-video.mp4");
    const persisted = JSON.parse(await readFile(filePath, "utf8"));
    assert.equal(persisted.dishes[0].videoUrl, dish.videoUrl);
    assert.deepEqual(calls, [
      ["upload", "pasta.mp4", "video/mp4"],
      ["remove", "dishes/pasta/old-video.mp4"],
    ]);
  }, { videoStorage });
});

test("DELETE dish removes its managed video", async () => {
  const removed = [];
  const videoStorage = {
    async upload() {},
    async remove(key) {
      removed.push(key);
    },
    async getPlaybackUrl() {
      return null;
    },
  };

  await withServer(async ({ baseUrl, filePath }) => {
    const menu = JSON.parse(await readFile(filePath, "utf8"));
    menu.dishes[0].videoUrl = "managed-video://dishes/pasta/video.mp4";
    await writeFile(filePath, JSON.stringify(menu), "utf8");
    const response = await fetch(`${baseUrl}/api/admin/dishes/pasta`, { method: "DELETE" });
    assert.equal(response.status, 204);
    assert.deepEqual(removed, ["dishes/pasta/video.mp4"]);
  }, { videoStorage });
});

test("DELETE dish removes its title from pairings of remaining dishes", async () => {
  await withServer(async ({ baseUrl, filePath }) => {
    const menu = JSON.parse(await readFile(filePath, "utf8"));
    menu.categories.push({ id: "drinks", title: "Напитки" });
    menu.dishes.push({
      ...menu.dishes[0],
      id: "lemonade",
      categoryId: "drinks",
      title: "Лимонад",
      pairings: ["Паста"],
    });
    await writeFile(filePath, JSON.stringify(menu), "utf8");

    const response = await fetch(`${baseUrl}/api/admin/dishes/pasta`, { method: "DELETE" });
    assert.equal(response.status, 204);
    const persisted = JSON.parse(await readFile(filePath, "utf8"));
    assert.deepEqual(persisted.dishes[0].pairings, []);
  });
});

test("GET /api/menu exposes managed videos through a stable API URL", async () => {
  await withServer(async ({ baseUrl, filePath }) => {
    const menu = JSON.parse(await readFile(filePath, "utf8"));
    menu.dishes[0].videoUrl = "managed-video://dishes/pasta/video.mp4";
    await writeFile(filePath, JSON.stringify(menu), "utf8");

    const response = await fetch(`${baseUrl}/api/menu`);
    const payload = await response.json();
    assert.equal(payload.dishes[0].videoUrl, `${baseUrl}/api/videos/dishes%2Fpasta%2Fvideo.mp4`);
  });
});

test("GET /api/videos/:key redirects to the bucket playback URL", async () => {
  const videoStorage = {
    async upload() {},
    async remove() {},
    async getPlaybackUrl(key) {
      assert.equal(key, "dishes/pasta/video.mp4");
      return "https://bucket.example/video";
    },
  };

  await withServer(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/videos/${encodeURIComponent("dishes/pasta/video.mp4")}`, {
      redirect: "manual",
    });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "https://bucket.example/video");
  }, { videoStorage });
});

test("createMenuStore selects JSON locally and PostgreSQL with DATABASE_URL", () => {
  const jsonStore = createMenuStore({ databaseUrl: "", filePath: "unused.json" });
  assert.equal(jsonStore.kind, "json");

  const postgresStore = createMenuStore({
    databaseUrl: "postgres://example",
    pool: { query() {}, connect() {} },
  });
  assert.equal(postgresStore.kind, "postgres");
});
