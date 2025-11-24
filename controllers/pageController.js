<<<<<<< Updated upstream
import path from 'path';
import { fileURLToPath } from 'url';
=======
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
>>>>>>> Stashed changes

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagesDirectory = path.join(__dirname, '..', 'frontend', 'pages');

export const getHomePage = (req, res) => {
    res.sendFile(path.join(pagesDirectory, 'homePage.html'));
};

export const getSignUpPage = (req, res) => {
    res.sendFile(path.join(pagesDirectory, 'signUpPage.html'));
};

export const getLoginPage = (req, res) => {
    res.sendFile(path.join(pagesDirectory, 'loginPage.html'));
};

export const getEditorPage = (req, res) => {
<<<<<<< Updated upstream
    res.sendFile(path.join(pagesDirectory, 'editor.html'));
};
=======
    const filePath = path.join(pagesDirectory, 'editor.html')

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error loading page')
        }

        const username = req.user?.username || 'Anonymous'
        const modifiedHtml = data.replace(
            '</head>',
            `    <meta name="username" content="${username}">\n</head>`
        )

        res.send(modifiedHtml)
    })
}
>>>>>>> Stashed changes
