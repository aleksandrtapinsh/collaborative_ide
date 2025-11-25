import express from 'express'
import passport from 'passport'
import { signUp, login } from '../controllers/authController.js'

const router = express.Router()

router.post('/signUp', signUp)
router.post('/login', login, passport.authenticate('local', {
    successRedirect: '/editor',
    failureRedirect: '/login'
}))

export default router