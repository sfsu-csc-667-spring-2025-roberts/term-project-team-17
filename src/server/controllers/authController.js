const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../db/prismaClient");
const e = require("express");

// ----------------------------- GET -----------------------------

const signup_get = (req, res) => {
    res.render("auth/signup");
}

const login_get = (req, res) => {
    res.render("auth/login");
}

// ----------------------------- POST -----------------------------

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '24h' })
}

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return null
        }
        return decoded
    })
}

const signup_post = async (req, res) => {
    const { username, email, password } = req.body;

    const hashedPassword = bcrypt.hashSync(password, 8);

    // Guard clauses
    let errors = { username: "", email: "", password: "" };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!username) errors.username = "Please enter a username";
    if (!email) errors.email = "Please enter an email address";
    if (!password) errors.password = "Please enter a password";
    if (password.length < 6) errors.password = "Password must be at least 6 characters";
    if (password.length > 20) errors.password = "Password must be at most 20 characters";
    if (username.length < 8) errors.username = "Username must be at least 8 characters";
    if (username.length > 20) errors.username = "Username must be at most 20 characters";
    if (!emailRegex.test(email)) errors.email = "Please enter a valid email address";
    if (await prisma.user.findUnique({ where: { username } })) errors.username = "Username already exists";
    if (await prisma.user.findUnique({ where: { email } })) errors.email = "Email already exists";
    if (errors.username || errors.email || errors.password) return res.status(400).send({errors});

    // Create user
    try {
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });

        const token = createToken(user.id);
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        });
        res.status(201).json({ user: { id: user.id, username: user.username, email: user.email }, token });
    } catch (err) {

        console.log(err.code)

        res.status(500).send({ message: "Server Error" });
    }
}

const login_post = async (req, res) => {
    const { usernameOrEmail, password } = req.body

    // Guard clauses
    let errors = { usernameOrEmail: "", password: "" };
    if (!usernameOrEmail) errors.usernameOrEmail = "Please enter a Username or Email";
    if (!password) errors.password = "Please enter a password";
    if (errors.usernameOrEmail || errors.password) return res.status(400).send({errors});

    try {
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: usernameOrEmail },
                    { email: usernameOrEmail }]}})
        if (!user) return res.status(404).send({ errors: { usernameOrEmail: "User not found" }});

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).send({ errors: { password: "Invalid password" }});

        const token = createToken(user.id)
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        })
        res.json({ token })
    } catch (err) {
        console.log(err.message)
        res.sendStatus(503)
    }

}

module.exports = {
    signup_get,
    signup_post,
    login_get,
    login_post,
};