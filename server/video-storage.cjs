const { randomUUID } = require("node:crypto");
const { createReadStream } = require("node:fs");
const { copyFile, mkdir, rm, stat } = require("node:fs/promises");
const path = require("node:path");
const { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

function safeExtension(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  return /^[.][a-z0-9]{1,8}$/.test(extension) ? extension : ".mp4";
}

function createObjectKey(dishId, originalName) {
  return `dishes/${dishId}/${randomUUID()}${safeExtension(originalName)}`;
}

function createLocalVideoStorage({ directory }) {
  return {
    kind: "local",
    localDirectory: directory,
    async upload(file, dishId) {
      const key = createObjectKey(dishId, file.originalname);
      const destination = path.join(directory, ...key.split("/"));
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(file.path, destination);
      return key;
    },
    async remove(key) {
      const target = path.resolve(directory, ...key.split("/"));
      const root = `${path.resolve(directory)}${path.sep}`;
      if (!target.startsWith(root)) return;
      await rm(target, { force: true });
    },
    async getPlaybackUrl(key) {
      return `/local-videos/${key.split("/").map(encodeURIComponent).join("/")}`;
    },
  };
}

function createS3VideoStorage({
  endpoint,
  region,
  bucket,
  accessKeyId,
  secretAccessKey,
}) {
  const client = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: false,
  });

  return {
    kind: "s3",
    async upload(file, dishId) {
      const key = createObjectKey(dishId, file.originalname);
      const fileStat = await stat(file.path);
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: createReadStream(file.path),
          ContentLength: fileStat.size,
          ContentType: file.mimetype,
        }),
      );
      return key;
    },
    async remove(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
    async getPlaybackUrl(key) {
      return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
        expiresIn: 60 * 60 * 24,
      });
    },
  };
}

function createVideoStorage(options = {}) {
  const endpoint = options.endpoint ?? process.env.AWS_ENDPOINT_URL ?? process.env.ENDPOINT;
  const bucket = options.bucket ?? process.env.AWS_S3_BUCKET_NAME ?? process.env.BUCKET;
  const region = options.region ?? process.env.AWS_DEFAULT_REGION ?? process.env.REGION ?? "auto";
  const accessKeyId = options.accessKeyId ?? process.env.AWS_ACCESS_KEY_ID ?? process.env.ACCESS_KEY_ID;
  const secretAccessKey =
    options.secretAccessKey ?? process.env.AWS_SECRET_ACCESS_KEY ?? process.env.SECRET_ACCESS_KEY;

  if (endpoint && bucket && accessKeyId && secretAccessKey) {
    return createS3VideoStorage({ endpoint, bucket, region, accessKeyId, secretAccessKey });
  }

  return createLocalVideoStorage({
    directory: options.directory ?? path.join(__dirname, "data", "local-videos"),
  });
}

module.exports = { createLocalVideoStorage, createS3VideoStorage, createVideoStorage };
