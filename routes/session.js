const { Router } = require("express");
const { auth } = require("firebase-admin");
const router = Router();
const Guard = require("../src/guard");

router.post("/", Guard.firebase("admin", "moderator"), (req, res) => {
  let { access_token, granted_scopes } = req.body;
  if (!access_token || !granted_scopes) {
    return res.status(400).end();
  }
  // let uid = req.auth.uid;
  // userSessions[uid] = { access_token, granted_scopes, issued: Date.now() };
  auth().setCustomUserClaims(req.auth.uid, {
    role: req.auth.role,
    access_token,
  });
  res.status(201).end();
});

router.get("/", Guard.firebase("admin", "moderator"), (req, res) => {
  const session = req.auth.access_token;
  if (!session) return res.json({ access_token: null }).end();
  return res.json(session).end();
});

module.exports = router;
