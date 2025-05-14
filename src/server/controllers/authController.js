const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../db/prismaClient");

const signup_post = async (req, res) => {
    const { username, email, password } = req.body;

    const hashedPassword = bcrypt.hashSync(password, 8);

    try {
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' })
        res.json({ token })
    } catch (err) {
        console.log(err.message)
        res.sendStatus(503)
    }
}


const login_post = async (req, res) => {
    const { usernameOrEmail, password } = req.body

    try {
        const user = await prisma.user.findUnique({
            where: {
                username: usernameOrEmail
            }
        })

        if (!user) {
            user = await prisma.user.findUnique({
                where: {
                    email: usernameOrEmail
                }
            })
        }

        // 404 if the user does not exist
        if (!user) { return res.status(404).send({ message: "User not found" }) }

        const passwordIsValid = bcrypt.compareSync(password, user.password)
        
        // 401 if the password is invalid
        if (!passwordIsValid) { return res.status(401).send({ message: "Invalid password" }) }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' })
        res.json({ token })
    } catch (err) {
        console.log(err.message)
        res.sendStatus(503)
    }

}

const signup_get = (req, res) => {
    res.render("auth/signup");
}

const login_get = (req, res) => {
    res.render("auth/login");
}

module.exports = {
    signup_get,
    signup_post,
    login_get,
    login_post,
};