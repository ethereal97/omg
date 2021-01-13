const { Router } = require("express");
const { database } = require("firebase-admin");
const router = Router();
const Guard = require("../src/guard");
const databaseName = process.env.FIREBASE_DATABASE_NAME;
const response = { products: 0, categories: 0, inventory: 0 };

router.get("/", Guard.firebase("admin", "moderator"), async (req, res) => {
  const dbRef = database().ref(`${databaseName}/metadata/collection`);
  const snapshot = await dbRef.get();
  if (!snapshot.exists()) return res.json(response).end();
  const data = snapshot.val();
  response.categories = (data.categories && data.categories.count) || 0;
  response.products = (data.products && data.products.count) || 0;
  response.inventory = (data.inventory && data.inventory.count) || 0;
  res.json(response).end();
});

router.get("/combo", Guard.firebase("admin", "moderator"), async (req, res) => {
  const colorsRef = await database().ref(`${databaseName}/colors`).get();
  const categoriesRef = await database()
    .ref(`${databaseName}/categories`)
    .get();

  const colors = [];
  const categories = [];

  Object.entries(colorsRef.val() || {}).map(([id, data]) => {
    colors.push({ id, title: data.title });
  });

  Object.entries(categoriesRef.val() || {}).map(([id, data]) => {
    categories.push({ id, title: data.title });
  });

  res
    .json({ colors: colors.reverse(), categories: categories.reverse() })
    .end();
});

module.exports = router;
