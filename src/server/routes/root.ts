import express from "express";

const router = express.Router();

router.get("/", (request, response) => {
  const title = "Home";
  const name = "Avinh";

  response.render("root", { title, name });
});

export default router;
