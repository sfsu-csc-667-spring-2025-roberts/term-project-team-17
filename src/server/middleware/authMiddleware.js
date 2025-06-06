const jwt = require("jsonwebtoken");
const prisma = require("../db/prismaClient");

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) return res.redirect("/login");

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.redirect("/login");
        return next();
    });
}

const checkUser = (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        res.locals.user = null;
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
        if (err) {
            res.locals.user = null;
            return next();
        }

        let user = await prisma.user.findUnique({ where: { id: decodedToken.id } });
        
        res.locals.user = user ? user : null;
        res.locals.user.jwt = token;

        return next();
    });
}

const getUserId = (req) => {
    const token = req.cookies.jwt;

    if (!token) return null;

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) return null;

    return decodedToken.id;
}

module.exports = { requireAuth, checkUser, getUserId };