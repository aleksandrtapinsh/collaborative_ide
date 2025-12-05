import express from 'express';
import { saveFile, openFile, newProject, loadProjects, createFile, deleteFile, deleteProject } from '../controllers/editorController.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router()

router.post('/save', checkAuth, saveFile);
router.get('/open/:id', checkAuth, openFile);
router.post('/new-project', checkAuth, newProject);
router.post('/create-file', checkAuth, createFile);
router.delete('/delete-file', checkAuth, deleteFile);
router.delete('/delete-project', checkAuth, deleteProject);
router.get('/projects', checkAuth, loadProjects);

export default router