import express from 'express'
import { getHomePage, getSignUpPage, getLoginPage, getEditorPage } from '../controllers/pageController.js'
import { checkAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/', getHomePage)
router.get('/signUp', getSignUpPage)
router.get('/login', getLoginPage)
router.get('/editor', checkAuth, getEditorPage)

export default router