import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import User from './models/User.js';

//Configurations
const app = express()
dotenv.config()
app.set('port', process.env.PORT || 8080)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagesDirectory = path.join(__dirname, 'frontend', 'pages');
mongoose.connect(process.env.MONGODB_URI)

//Middleware
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(pagesDirectory, 'homePage.html'))
})

app.get('/signUp', (req, res) => {
    res.sendFile(path.join(pagesDirectory, 'signUpPage.html'))
})

app.get('/login', (req, res) => {
    res.sendFile(path.join(pagesDirectory, 'loginPage.html'))
})

app.get('/editor', (req, res) => {
    res.sendFile(path.join(pagesDirectory, 'editor.html'))
})

app.post('/signUp', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(req.body.password, salt)
        console.log(salt)
        console.log(hashedPassword)
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword
        })
        await user.save()
        res.redirect('/');
    } catch {
        res.status(500).send()
    }
})

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt with email: ${email} and password: ${password}`);
    res.redirect('/');
})

//Error Handlers

//404
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err)
})

//Generic
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    })
})

//Bootup
app.listen(app.get('port'), () => {
    console.log(`Server on port ${app.get('port')}`)
})

export default app;