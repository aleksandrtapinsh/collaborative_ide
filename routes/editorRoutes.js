import express from 'express';
import { saveFile, openFile, newProject, loadProjects } from '../controllers/editorController.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router()

router.post('/save', checkAuth, saveFile);
router.get('/open/:id', checkAuth, openFile);
router.post('/new-project', checkAuth, newProject);
router.get('/projects', checkAuth, loadProjects)

export default router