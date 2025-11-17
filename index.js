import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { connectDB } from './config/database.js';
import { initializePassport } from './middleware/passport.js';
import { initializeSocket } from './services/socketService.js';
import pageRoutes from './routes/pageRoutes.js';
import authRoutes from './routes/authRoutes.js';
import editorRoutes from './routes/editorRoutes.js';
import passport from 'passport';

dotenv.config();

const app = express();
const server = createServer(app);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
connectDB();

// Middleware
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || '1234',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Initialize Passport
initializePassport(passport);

// Initialize Socket.IO
initializeSocket(server);

// Routes
app.use('/', pageRoutes);
app.use('/', authRoutes);
app.use('/editor', editorRoutes);

// 404 Handler
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

// Start Server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server on port ${PORT}`);
});

export default app;