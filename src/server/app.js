const express = require('express');
const morgan = require('morgan');
const path = require('path');

const app = express();

// Middleware
app.use(morgan("dev"));
app.use(express.static(path.join(process.cwd(), "public")));

// View Engine
app.set("views", path.join(process.cwd(), "src", "server", "views"));
app.set("view engine", "ejs");

// Routes
app.get("/", (req, res) => {
    res.render("index", {
        title: "Home",
        message: "Welcome to the Home Page",
    });
});

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});