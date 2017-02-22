var express = require("express");
var router = express.Router();
var multer = require("multer");
var fs = require("fs");
var path = require("path");

var db = require("../model/db");

// Limit uploaded levels to 1MB (huge compared to current level sizes, ~100KB for a large level).
// 40K levels can fit into 5GB, which is the default for AWS server.
var upload = multer({dest: "levels", limits: {fileSize: 1e6}});

router.get("/", function (req, res) {
  res.send("DM web server");
});

router.post("/levels", upload.single("level"), function (req, res) {
  var levelName = req.body.levelName;
  var levelInfo = {};
  var oldFilename = db.get("levelInfo").get(levelName).get("__filename").value();
  if (oldFilename != null && fs.existsSync(path.join("levels", oldFilename)))
  {
    fs.unlinkSync(path.join("levels", oldFilename));
  }
  levelInfo[levelName] = {
    name: levelName,
    author: req.body.author,
    description: req.body.description,
    size: req.file.size,
    __filename: req.file.filename
  };
  db.get("levels")
  .push(levelName)
  .write()
  .then(function () {
    return db.get("levelInfo")
      .assign(levelInfo)
      .write();
  }).then(function() {
    res.send();
  })
});

router.get("/levels", function (req, res) {
  res.json(db.get("levelInfo").value());
});

router.get("/levels/:name", function (req, res) {
  var levelName = req.params.name;
  var info = db
    .get("levelInfo")
    .get(levelName)
    .omitBy(function(key) { return key[0] == "_"; })
    .value();
  res.json(info);
});

router.get("/levels/download/:name", function ( req, res) {
  var levelName = req.params.name;
  var filename = db.get("levelInfo").get(levelName).get("__filename").value();
  res.sendFile(path.join(__dirname, "levels", filename));
});

module.exports = router;