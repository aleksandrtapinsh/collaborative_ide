import express from 'express';
import session from 'express-session'
import dotenv from 'dotenv';
import path from 'path';
import {createServer} from 'http';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import User from './models/User.js';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import {Server} from 'socket.io';

//Configurations
const app = express()
const server = createServer(app)
const io = new Server(server)
dotenv.config()
app.set('port', process.env.PORT || 8080)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagesDirectory = path.join(__dirname, 'frontend', 'pages');
mongoose.connect(process.env.MONGODB_URI)

// Store editor sessions
const editorSessions = new Map();

io.on('connection', (socket) => {
    console.log('a user connected');
    
    // Join an editor room
    socket.on('join-editor', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
        
        // Initialize room if it doesn't exist
        if (!editorSessions.has(roomId)) {
            editorSessions.set(roomId, {
                content: '',
                cursors: new Map(),
                version: 0, // Add version control
                lastAppliedChange: null
            });
        }
        
        const session = editorSessions.get(roomId);
        
        // Send current content to the new user
        socket.emit('editor-init', {
            content: session.content || '',
            cursors: session.cursors ? Array.from(session.cursors.entries()) : [],
            version: session.version
        });
    });

    // Handle text changes with version control
    socket.on('text-change', (data) => {
        const { roomId, change, clientVersion } = data;
        const session = editorSessions.get(roomId);
        
        if (session && change) {
            // Basic version conflict detection
            if (clientVersion !== session.version) {
                console.log(`Version conflict: client ${clientVersion}, server ${session.version}`);
                // Send current server state to resolve conflict
                socket.emit('force-sync', {
                    content: session.content,
                    version: session.version
                });
                return;
            }
            
            // Update server content
            session.content = applyChange(session.content, change);
            session.version++;
            session.lastAppliedChange = change;
            
            // Broadcast to other users in the room with version info
            socket.to(roomId).emit('remote-change', {
                change: change,
                socketId: socket.id,
                version: session.version
            });
            
            // Send confirmation to the sender
            socket.emit('change-applied', {
                version: session.version
            });
        }
    });

    // Handle cursor position changes
    socket.on('cursor-change', (data) => {
        const { roomId, position } = data;
        const session = editorSessions.get(roomId);
        
        if (session && position) {
            // Initialize cursors map if it doesn't exist
            if (!session.cursors) {
                session.cursors = new Map();
            }
            
            session.cursors.set(socket.id, {
                ...position,
                socketId: socket.id,
                color: generateColor(socket.id),
                lastUpdate: Date.now()
            });
            
            // Clean up old cursors (older than 30 seconds)
            cleanupOldCursors(session.cursors);
            
            // Broadcast cursor movement to other users
            socket.to(roomId).emit('cursor-update', {
                socketId: socket.id,
                position: session.cursors.get(socket.id)
            });
        }
    });

    // Handle force sync request (when client detects it's out of sync)
    socket.on('request-sync', (data) => {
        const { roomId } = data;
        const session = editorSessions.get(roomId);
        
        if (session) {
            socket.emit('force-sync', {
                content: session.content,
                version: session.version,
                cursors: Array.from(session.cursors.entries())
            });
        }
    });

    // Handle selection changes
    socket.on('selection-change', (data) => {
        const { roomId, selection } = data;
        socket.to(roomId).emit('selection-update', {
            socketId: socket.id,
            selection: selection
        });
    });

    // Handle leaving editor room
    socket.on('leave-editor', (roomId) => {
        const session = editorSessions.get(roomId);
        if (session && session.cursors) {
            session.cursors.delete(socket.id);
        }
        socket.to(roomId).emit('cursor-remove', { socketId: socket.id });
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        
        // Remove user's cursor from all rooms
        editorSessions.forEach((session, roomId) => {
            if (session && session.cursors && session.cursors.has(socket.id)) {
                session.cursors.delete(socket.id);
                socket.to(roomId).emit('cursor-remove', { socketId: socket.id });
            }
        });
    });
});

// Clean up old cursors
function cleanupOldCursors(cursors) {
    const now = Date.now();
    const maxAge = 30000; // 30 seconds
    
    for (let [socketId, cursor] of cursors) {
        if (now - cursor.lastUpdate > maxAge) {
            cursors.delete(socketId);
        }
    }
}

// Improved change application function
function applyChange(content, change) {
    if (!content) content = '';
    if (!change) return content;
    
    const lines = content.split('\n');
    
    try {
        if (change.action === 'insert') {
            const { row, column } = change.start;
            const textToInsert = change.lines ? change.lines.join('\n') : change.text;
            
            if (!textToInsert) return content;
            
            // Ensure the row exists
            while (lines.length <= row) {
                lines.push('');
            }
            
            const line = lines[row] || '';
            lines[row] = line.slice(0, column) + textToInsert + line.slice(column);
            
        } else if (change.action === 'remove') {
            const start = change.start;
            const end = change.end;
            
            if (start.row === end.row) {
                // Single line removal
                if (lines[start.row]) {
                    const line = lines[start.row];
                    lines[start.row] = line.slice(0, start.column) + line.slice(end.column);
                }
            } else {
                // Multi-line removal
                const firstLine = lines[start.row] || '';
                const lastLine = lines[end.row] || '';
                const newLine = firstLine.slice(0, start.column) + lastLine.slice(end.column);
                
                lines.splice(start.row, end.row - start.row + 1, newLine);
            }
        }
    } catch (error) {
        console.error('Error applying change:', error);
        return content; // Return original content if error occurs
    }
    
    return lines.join('\n');
}

function generateColor(socketId) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const index = socketId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
}
//Middleware
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: '1234',
    resave: false,
    saveUninitialized: false,
}))

app.use(passport.initialize())
app.use(passport.session())

// Test User
// const testUser = {
//     id: 1,
//     email: 'test@pfw.edu',
//     password: 'test'
// }

// Passport Authentication
passport.use(new LocalStrategy({ usernameField: 'email' },
    (email, password, done) => {

        User.findOne({
            email: email,
        })
        .then(user => {
            console.log(user)
            if(user) {
                bcrypt.compare(password, user.password, (err, matchstate) => {
                    if(err) {
                        return done(err);
                    }
                    if(matchstate === true) return done(null, user);
                    else {
                        console.log('Invalid Local Login');
                        return done(null, false, { message: 'Invalid Local Login' });
                    }
                });
            } else {
                console.log('Account Does Not Exist');
                return done(null, false, { message: 'Account Doesn\'t Exist' });
            }
        })
        .catch(err => done(err))

        // Test User Auth
        // if (email === testUser.email && password === testUser.password) {
        //     return done(null, testUser)
        // }
        // else {
        //     return done(null, false, { message: 'Invalid Local Login' })
        // }
    }
))

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser((id, done) => {
        User.findById(id)
        .then(user => {
            if (!user) return done(new Error('User not Found'));
            done(null, user);
        })
        .catch(err => done(err));
})

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

//Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(pagesDirectory, 'homePage.html'))
})

app.get('/signUp', (req, res) => {
    res.sendFile(path.join(pagesDirectory, 'signUpPage.html'))
})

app.get('/login', (req, res) => {
    res.sendFile(path.join(pagesDirectory, 'loginPage.html'))
})

app.get('/editor', checkAuth, (req, res) => {
    res.sendFile(path.join(pagesDirectory, 'editor.html'))
})

app.post('/signUp', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(req.body.password, salt)
        console.log(salt)
        console.log(hashedPassword)
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword
        })
        await user.save()
        res.redirect('/');
    } catch {
        res.status(500).send()
    }
})

app.post('/login', (req, res, next) => {
    console.log('Login Credentials: ', req.body);
    next();
}, passport.authenticate('local', {
    successRedirect: '/editor',
    failureRedirect: '/login'
}));

//Error Handlers

//404
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err)
})

//Generic
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    })
})

//Bootup
server.listen(app.get('port'), () => {
    console.log(`Server on port ${app.get('port')}`)
})

export default app;