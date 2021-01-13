const path = require("path");
const jimp = require("jimp");
const multer = require("multer");

const IMAGE_WIDTH = jimp.AUTO;
const IMAGE_HEIGHT = 480;

const MIME_TYPE_EXTENSION = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/svg": "svg",
};

module.exports = async (file, code) => {
  let ext = file && file.mimetype && MIME_TYPE_EXTENSION[file.mimetype];
  if (!ext) {
    let errors = [];
    if (!file) errors.push("Required to upload an image");
    if (!ext) errors.push("Unsupported image type");
    throw { errors };
  }
  let { filename, path, destination } = file;
  let fileName = `${Date.now()}-${filename}.${ext}`;
  let output = `${destination}/${fileName}`;
  // let protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  let image = await jimp.read(path);
  let { height, width } = image.bitmap;
  let white = await jimp.loadFont(jimp.FONT_SANS_16_WHITE);
  let black = await jimp.loadFont(jimp.FONT_SANS_16_BLACK);
  if (
    (IMAGE_HEIGHT != jimp.AUTO && height > IMAGE_HEIGHT) ||
    (IMAGE_WIDTH != jimp.AUTO && width > IMAGE_WIDTH)
  ) {
    await image.resize(IMAGE_WIDTH, IMAGE_HEIGHT);
  }
  await image.quality(80);
  if (code) {
    await image.print(black, 11, 19, `#${code}`);
    await image.print(black, 9, 21, `#${code}`);
    await image.print(black, 11, 21, `#${code}`);
    await image.print(black, 9, 19, `#${code}`);
    await image.print(white, 10, 20, `#${code}`);
  }
  return new Promise((resolve) => {
    image.write(output, () => {
      resolve({ output, fileName });
    });
  });
};
