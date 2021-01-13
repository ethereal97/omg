const express = require("express");
const { database, storage } = require("firebase-admin");
const router = express.Router();
const Product = require("../src/Product");
const Guard = require("../src/guard");
const databaseName = process.env.FIREBASE_DATABASE_NAME;
const multer = require("multer");
const upload = multer({ dest: `${process.cwd()}/tmp` });
const optimizer = require("../src/image");

router.get("/", Guard.firebase("moderator", "admin"), async (req, res) => {
  try {
    const dbRef = database().ref(databaseName).child("products");
    const snapshot = await dbRef.get();
    const products = snapshot.exists() ? Object.entries(snapshot.val()) : [];
    const response = [];
    for (let [id, data] of products) {
      let product = new Product({ id, ...data });
      await product.fetch({ stocks: true });
      response.push(product);
    }
    return res.json(response.reverse()).end();
  } catch (e) {
    console.error(e);
    res.status(e.code || 400).end();
  }
});

router.post(
  "/",
  Guard.firebase("admin", "moderator"),
  upload.any(),
  async (req, res) => {
    try {
      const dbRef = database().ref(`${databaseName}/products`);
      const product = new Product(req.body);

      if (req.files.length) {
        for (let file of req.files) {
          let { output, fileName } = await optimizer(file, product.code);
          await storage().bucket().upload(output);
          let storageRef = storage().bucket().file(fileName);
          storageRef.makePublic();
          product.images.push(storageRef.publicUrl());
        }
      }
      product.uid = req.auth.uid;
      product.createdAt = database.ServerValue.TIMESTAMP;
      product.id = (await dbRef.push(product.val())).key;
      await database()
        .ref(`${databaseName}/metadata/collection/products`)
        .update({
          count: database.ServerValue.increment(1),
        });
      if (product.category) {
        await database()
          .ref(`${databaseName}/categories`)
          .push()
          .update({
            title: product.category,
            count: database.ServerValue.increment(1),
          });
        await database()
          .ref(`${databaseName}/metadata/collection/categories`)
          .update({
            count: database.ServerValue.increment(1),
          });
      }
      res.status(201).json(product);
    } catch (e) {
      console.error(e);
      res.status(e.code || 400);
    }
    res.end();
  }
);

router.get("/:id", Guard.firebase("admin", "moderator"), async (req, res) => {
  const { id } = req.params;
  try {
    const dbRef = database().ref(`${databaseName}/products/${id}`);
    const snapshot = await dbRef.get();
    if (!snapshot.exists()) {
      throw { code: 404 };
    }
    let product = new Product({
      id: snapshot.key,
      ...snapshot.toJSON(),
    });
    await product.fetch({ owner: true, stocks: true });
    res.json(product).end();
  } catch (e) {
    console.error(e);
    res.status(e.code || 400);
  }
  res.end();
});

router.delete(
  "/:id",
  Guard.firebase("admin", "moderator"),
  async (req, res) => {
    const { id } = req.params;
    try {
      await Product.remove(id);
      res.status(202).end();
    } catch (e) {
      console.error(e);
      res.status(e.code || 400);
    }
    res.end();
  }
);

module.exports = router;
