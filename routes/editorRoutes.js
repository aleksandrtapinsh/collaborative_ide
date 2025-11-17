import express from 'express'
import { saveFile, openFile } from '../controllers/editorController.js'
import { checkAuth } from '../middleware/auth.js'

const router = express.Router()

router.post('/save', checkAuth, saveFile)
router.get('/open/:id', checkAuth, openFile)

export default router