import express from "express";
const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: `Express: ${process.env.TEXT}` });
});

export default router;
