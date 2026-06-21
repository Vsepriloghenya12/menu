const express = require("express");
const { randomUUID } = require("node:crypto");
const { rm } = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const multer = require("multer");
const { validateAddOn, validateCategory, validateDish } = require("./menu-validation.cjs");

const uploadVideo = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 500 * 1024 * 1024, files: 1 },
  fileFilter(_request, file, callback) {
    callback(null, file.mimetype.startsWith("video/"));
  },
});

function managedVideoKey(videoUrl) {
  return videoUrl?.startsWith("managed-video://") ? videoUrl.slice("managed-video://".length) : null;
}

function createApp({ store, videoStorage, distPath = path.join(__dirname, "..", "dist") }) {
  const app = express();
  app.set("trust proxy", true);
  app.use(express.json({ limit: "1mb" }));
  app.use((request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    if (request.method === "OPTIONS") return response.sendStatus(204);
    next();
  });

  app.get("/api/menu", async (_request, response, next) => {
    try {
      const menu = await store.getMenu();
      const baseUrl = `${_request.protocol}://${_request.get("host")}`;
      response.json({
        ...menu,
        dishes: menu.dishes.map((dish) => {
          const key = managedVideoKey(dish.videoUrl);
          return key
            ? { ...dish, videoUrl: `${baseUrl}/api/videos/${encodeURIComponent(key)}` }
            : dish;
        }),
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/menu", async (_request, response, next) => {
    try {
      response.json(await store.getMenu());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/videos/:key", async (request, response, next) => {
    try {
      const playbackUrl = await videoStorage.getPlaybackUrl(request.params.key);
      if (!playbackUrl) {
        return response.status(404).json({ code: "NOT_FOUND", message: "Видео не найдено" });
      }
      response.redirect(playbackUrl);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/categories", async (request, response, next) => {
    try {
      const result = validateCategory(request.body);
      if (result.fields) {
        return response.status(400).json({
          code: "VALIDATION_ERROR",
          message: "Проверьте название группы",
          fields: result.fields,
        });
      }
      const category = await store.createCategory({ id: randomUUID(), title: result.title });
      response.status(201).json(category);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/categories/:id", async (request, response, next) => {
    try {
      const result = validateCategory(request.body);
      if (result.fields) {
        return response.status(400).json({
          code: "VALIDATION_ERROR",
          message: "Проверьте название группы",
          fields: result.fields,
        });
      }
      const category = await store.updateCategory(request.params.id, result.title);
      if (!category) {
        return response.status(404).json({ code: "NOT_FOUND", message: "Группа не найдена" });
      }
      response.json(category);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/categories/:id", async (request, response, next) => {
    try {
      const menu = await store.getMenu();
      const videoKeys = menu.dishes
        .filter((dish) => dish.categoryId === request.params.id)
        .map((dish) => managedVideoKey(dish.videoUrl))
        .filter(Boolean);
      const result = await store.deleteCategory(request.params.id);
      if (!result) {
        return response.status(404).json({ code: "NOT_FOUND", message: "Группа не найдена" });
      }
      await Promise.allSettled(videoKeys.map((key) => videoStorage.remove(key)));
      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/add-ons", async (request, response, next) => {
    try {
      const result = validateAddOn(request.body);
      if (result.fields) {
        return response.status(400).json({
          code: "VALIDATION_ERROR",
          message: "Проверьте данные допа",
          fields: result.fields,
        });
      }
      const addOn = await store.createAddOn({ id: randomUUID(), ...result.addOn });
      response.status(201).json(addOn);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/add-ons/:id", async (request, response, next) => {
    try {
      const result = validateAddOn(request.body);
      if (result.fields) {
        return response.status(400).json({
          code: "VALIDATION_ERROR",
          message: "Проверьте данные допа",
          fields: result.fields,
        });
      }
      const addOn = await store.updateAddOn(request.params.id, result.addOn);
      if (!addOn) {
        return response.status(404).json({ code: "NOT_FOUND", message: "Доп не найден" });
      }
      response.json(addOn);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/add-ons/:id", async (request, response, next) => {
    try {
      const removed = await store.deleteAddOn(request.params.id);
      if (!removed) {
        return response.status(404).json({ code: "NOT_FOUND", message: "Доп не найден" });
      }
      response.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/dishes/:id", async (request, response, next) => {
    try {
      const result = validateDish(request.body, request.params.id);
      if (result.fields) {
        return response.status(400).json({
          code: "VALIDATION_ERROR",
          message: "Проверьте данные блюда",
          fields: result.fields,
        });
      }

      const dish = await store.updateDish(request.params.id, result.dish);
      if (!dish) {
        return response.status(404).json({ code: "NOT_FOUND", message: "Блюдо не найдено" });
      }
      response.json(dish);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/dishes/:id", async (request, response, next) => {
    try {
      const menu = await store.getMenu();
      const currentDish = menu.dishes.find((dish) => dish.id === request.params.id);
      const removed = await store.deleteDish(request.params.id);
      if (!removed) {
        return response.status(404).json({ code: "NOT_FOUND", message: "Блюдо не найдено" });
      }
      const videoKey = managedVideoKey(currentDish?.videoUrl);
      if (videoKey) {
        await videoStorage.remove(videoKey).catch(() => {});
      }
      response.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/dishes/:id/video", uploadVideo.single("video"), async (request, response, next) => {
    const file = request.file;
    if (!file) {
      return response.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Выберите видеофайл",
        fields: { video: "Поддерживаются видеофайлы размером до 500 МБ" },
      });
    }

    let newKey;
    try {
      const menu = await store.getMenu();
      const currentDish = menu.dishes.find((dish) => dish.id === request.params.id);
      if (!currentDish) {
        return response.status(404).json({ code: "NOT_FOUND", message: "Блюдо не найдено" });
      }

      newKey = await videoStorage.upload(file, currentDish.id);
      const previousKey = managedVideoKey(currentDish.videoUrl);
      const updatedDish = { ...currentDish, videoUrl: `managed-video://${newKey}` };
      const savedDish = await store.updateDish(currentDish.id, updatedDish);
      if (previousKey && previousKey !== newKey) {
        await videoStorage.remove(previousKey);
      }
      response.json(savedDish);
    } catch (error) {
      if (newKey) {
        await videoStorage.remove(newKey).catch(() => {});
      }
      next(error);
    } finally {
      await rm(file.path, { force: true }).catch(() => {});
    }
  });

  if (videoStorage.localDirectory) {
    app.use("/local-videos", express.static(videoStorage.localDirectory));
  }
  app.use(express.static(distPath));
  app.use((request, response, next) => {
    if (request.method !== "GET" || request.path.startsWith("/api/")) return next();
    response.sendFile(path.join(distPath, "index.html"), (error) => (error ? next(error) : undefined));
  });

  app.use((error, _request, response, _next) => {
    console.error(error);
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return response.status(413).json({
        code: "VIDEO_TOO_LARGE",
        message: "Размер видео не должен превышать 500 МБ",
      });
    }
    response.status(500).json({ code: "INTERNAL_ERROR", message: "Не удалось выполнить операцию" });
  });

  return app;
}

module.exports = { createApp };
