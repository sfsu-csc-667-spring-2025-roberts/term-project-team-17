import express from "express";
import httpError from "http-errors";
import morgan from "morgan";
import path from "path";

import rootRoutes from "./routes/root";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(process.cwd(), "public")));
app.set("views", path.join(process.cwd(), "src", "server", "templates"));
app.set("view engine", "ejs");

app.use("/", rootRoutes);

app.use((_request, _response, next) => {
  next(httpError(404, "Not found"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
