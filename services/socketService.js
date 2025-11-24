import { Server } from 'socket.io';
import editorService from './editorService.js';

export const initializeSocket = (server) => {
    const io = new Server(server);

    io.on('connection', (socket) => {
        console.log('a user connected');

<<<<<<< Updated upstream
        socket.on('join-editor', (roomId) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room ${roomId}`);
=======
        socket.on('join-editor', (data) => {
            const roomId = data.roomId || data
            const username = data.username || 'Anonymous'

            socket.join(roomId)
            socket.username = username // Store username on socket
            console.log(`User ${socket.id} (${username}) joined room ${roomId}`)
>>>>>>> Stashed changes

            const session = editorService.createSession(roomId);

            socket.emit('editor-init', {
                content: session.content || '',
                cursors: session.cursors ? Array.from(session.cursors.entries()) : [],
                version: session.version
<<<<<<< Updated upstream
            });
        });
=======
            })

            // Notify other users that someone joined
            socket.to(roomId).emit('user-joined', {
                socketId: socket.id,
                username: username
            })
        })
>>>>>>> Stashed changes

        socket.on('text-change', (data) => {
            const { roomId, change, clientVersion } = data;
            const result = editorService.updateContent(roomId, change, clientVersion);

            if (!result) return;

            if (result.conflict) {
                console.log(`Version conflict: client ${clientVersion}, server ${result.session.version}`);
                socket.emit('force-sync', {
                    content: result.session.content,
                    version: result.session.version
                });
                return;
            }

            socket.to(roomId).emit('remote-change', {
                change: change,
                socketId: socket.id,
                version: result.session.version
            });

            socket.emit('change-applied', {
                version: result.session.version
            });
        });

        socket.on('cursor-change', (data) => {
            const { roomId, position } = data;
            const cursor = editorService.updateCursor(roomId, socket.id, position);

            if (cursor) {
                socket.to(roomId).emit('cursor-update', {
                    socketId: socket.id,
                    username: socket.username || 'Anonymous',
                    position: cursor
                });
            }
        });

        socket.on('request-sync', (data) => {
            const { roomId } = data;
            const session = editorService.getSession(roomId);

            if (session) {
                socket.emit('force-sync', {
                    content: session.content,
                    version: session.version,
                    cursors: Array.from(session.cursors.entries())
                });
            }
        });

        socket.on('selection-change', (data) => {
            const { roomId, selection } = data;
            socket.to(roomId).emit('selection-update', {
                socketId: socket.id,
                selection: selection
            });
        });

        socket.on('leave-editor', (roomId) => {
<<<<<<< Updated upstream
            editorService.removeCursor(roomId, socket.id);
            socket.to(roomId).emit('cursor-remove', { socketId: socket.id });
        });
=======
            editorService.removeCursor(roomId, socket.id)
            socket.to(roomId).emit('cursor-remove', {
                socketId: socket.id,
                username: socket.username || 'Anonymous'
            })
        })
>>>>>>> Stashed changes

        socket.on('disconnect', () => {
            console.log('user disconnected');
            // Remove cursor from all sessions
            editorService.sessions.forEach((session, roomId) => {
<<<<<<< Updated upstream
                editorService.removeCursor(roomId, socket.id);
                socket.to(roomId).emit('cursor-remove', { socketId: socket.id });
            });
        });
    });
=======
                editorService.removeCursor(roomId, socket.id)
                socket.to(roomId).emit('cursor-remove', {
                    socketId: socket.id,
                    username: socket.username || 'Anonymous'
                })
            })
        })
    })
>>>>>>> Stashed changes

    return io;
};