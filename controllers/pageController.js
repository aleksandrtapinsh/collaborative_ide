import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const pagesDirectory = path.join(__dirname, '..', 'frontend', 'pages')

export const getHomePage = (req, res) => {
    res.sendFile(path.join(pagesDirectory, 'homePage.html'))
}

export const getSignUpPage = (req, res) => {
    res.sendFile(path.join(pagesDirectory, 'signUpPage.html'))
}

export const getLoginPage = (req, res) => {
    res.sendFile(path.join(pagesDirectory, 'loginPage.html'))
}

export const getEditorPage = (req, res) => {
    res.sendFile(path.join(pagesDirectory, 'editor.html'))
}