const { createApp } = require("./app.cjs");
const { createMenuStore } = require("./create-menu-store.cjs");
const { createVideoStorage } = require("./video-storage.cjs");

const port = Number(process.env.PORT) || 3001;
const store = createMenuStore();
const videoStorage = createVideoStorage();
const app = createApp({ store, videoStorage });

app.listen(port, "0.0.0.0", () => {
  console.log(`Video Menu server listening on http://0.0.0.0:${port}`);
});
