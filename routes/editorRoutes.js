import express from 'express';
<<<<<<< Updated upstream
import { saveFile, openFile } from '../controllers/editorController.js';
=======
import { saveFile, openFile, newProject, loadProjects, createFile, deleteFile, deleteProject } from '../controllers/editorController.js';
>>>>>>> Stashed changes
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/save', checkAuth, saveFile);
router.get('/open/:id', checkAuth, openFile);
<<<<<<< Updated upstream
=======
router.post('/new-project', checkAuth, newProject);
router.post('/create-file', checkAuth, createFile);
router.delete('/delete-file', checkAuth, deleteFile);
router.delete('/delete-project', checkAuth, deleteProject);
router.get('/projects', checkAuth, loadProjects)
>>>>>>> Stashed changes

export default router;