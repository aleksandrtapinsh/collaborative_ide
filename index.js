import express from 'express';
import session from 'express-session'
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import User from './models/User.js';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

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

app.use(session({
    secret: '1234',
    resave: false,
    saveUninitialized: false,
}))

app.use(passport.initialize())
app.use(passport.session())

const testUser = {
    id: 1,
    email: 'test@pfw.edu',
    password: 'test'
}

// Passport Authentication with Test User Eventually replaced with DB values
passport.use(new LocalStrategy({ usernameField: 'email' },
    (email, password, done) => {
        if (email === testUser.email && password === testUser.password) {
            return done(null, testUser)
        }
        else {
            return done(null, false, { message: 'Invalid Local Login' })
        }
    }
))

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    if (id === testUser.id) {
        done(null, testUser)
    }
    else {
        done(new Error('User not Found'))
    }
})

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

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

app.get('/editor', checkAuth, (req, res) => {
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

app.post('/login', (req, res, next) => {
    console.log('Login Credentials: ', req.body);
    next();
}, passport.authenticate('local', {
    successRedirect: '/editor',
    failureRedirect: '/login'
}));

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