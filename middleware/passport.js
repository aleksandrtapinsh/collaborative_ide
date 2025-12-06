import { Strategy as LocalStrategy } from 'passport-local'
import bcrypt from 'bcrypt'
import User from '../models/User.js'

export const initializePassport = (passport) => {
    passport.use(new LocalStrategy(
        { usernameField: 'email' },
        async (email, password, done) => {
            try {
                const user = await User.findOne({ email })

                if (!user) {
                    console.log('Account Does Not Exist')
                    return done(null, false, { message: 'Account Doesn\'t Exist' })
                }

                const matchstate = await bcrypt.compare(password, user.password)

                if (matchstate) {
                    return done(null, user)
                } else {
                    console.log('Invalid Local Login')
                    return done(null, false, { message: 'Incorrect email or password' })
                }
            } catch (err) {
                return done(err)
            }
        }
    ))

    passport.serializeUser((user, done) => {
        done(null, user._id)
    })

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id)
            if (!user) return done(new Error('User not Found'))
            done(null, user)
        } catch (err) {
            done(err)
        }
    })
}

// ===== controllers/pageController.js =====
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