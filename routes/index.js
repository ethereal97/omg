const express = require("express");
const router = express.Router();
const serverStarted = Date.now();

const serverInfo = {
  requested: 0,
  latestClients: [],
  latestRequest: null,
  previousRequest: Date.now(),
};

router.use((req, res, next) => {
  serverInfo.latestClients.unshift(req.headers["forwarded"] || "::1");
  serverInfo.latestClients = serverInfo.latestClients.slice(0, 20);
  serverInfo.latestRequest = serverInfo.previousRequest;
  serverInfo.previousRequest = Date.now();
  serverInfo.requested++;
  req.accessToken = req.headers["x-access-token"] || null;
  res.setHeader("Cache-Control", "private;max-age=60;s-max-age=300");
  next();
});

router.use("/products", require("./products"));
router.use("/users", require("./users"));
router.use("/metadata", require("./metadata"));
router.use("/session", require("./session"));
router.use("/webhook", require("./webhook"));
router.use("/review", require("./review"));

router.all("/status", (req, res) => {
  const status = {
    started: serverStarted,
    timestamp: Date.now(),
    latestRequest: serverInfo.latestRequest,
    clients: serverInfo.latestClients.slice(0, 10),
    requested: serverInfo.requested,
  };
  if (req.query.mode) serverInfo.latestClients[0] = `[${req.query.mode}]`;
  if ("tz" in req.query) {
    let loc = req.query.lc || "en-US";
    let timeZone = req.query.tz || "UTC";
    status.started = new Date(status.started).toLocaleString(loc, {
      timeZone,
    });
    status.timestamp = new Date(status.timestamp).toLocaleString(loc, {
      timeZone,
    });
    status.latestRequest = new Date(status.latestRequest).toLocaleString(loc, {
      timeZone,
    });
  }
  res.json(status);
});

router.use((req, res) => {
  res.status(404).end();
});

module.exports = router;
