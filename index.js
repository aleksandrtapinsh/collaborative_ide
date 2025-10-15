import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';

//Configurations
const app = express()
dotenv.config()
app.set('port', process.env.PORT || 8080)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagesDirectory = path.join(__dirname, 'frontend','pages');

//Middleware
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

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

app.post('/signUp', (req, res) => {
    const { username, email, password } = req.body;
    console.log(`Signup attempt with username: ${username} email: ${email}, password: ${password}`)
    res.redirect('/');
})

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt with email: ${email} and password: ${password}`);
    res.redirect('/');
})
//Error Handlers

//Bootup
app.listen(app.get('port'), () => {
  console.log(`Server on port ${app.get('port')}`)
})

export default app;