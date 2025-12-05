import { Server } from 'socket.io'
import editorService from './editorService.js'

export const initializeSocket = (server) => {
    const io = new Server(server)

    io.on('connection', (socket) => {
        socket.currentFileID = null
        console.log('a user connected')

        socket.on('join-editor', (data) => {
            const roomId = data.roomId || data
            const fileID = data.fileID || 'default'
            const username = data.username || 'Anonymous'

            socket.join(roomId)
            socket.username = username // Store username on socket
            socket.currentFileID = fileID
            console.log(`User ${socket.id} (${username}) joined room ${roomId}`)

            const session = editorService.getSession(roomId) || editorService.createSession(roomId)
            const fileSession = editorService.getFileSession(roomId, fileID)
            const fileCursors = Array.from(session.cursors.values())
                .filter(c => c.fileID === fileID)
            socket.currentFileVersion = fileSession.version
            socket.emit('editor-init', {
                content: fileSession.content || '',
                cursors: fileCursors,
                version: fileSession.version
            })

            // Notify other users that someone joined
            socket.to(roomId).emit('user-joined', {
                socketId: socket.id,
                username: username
            })
        })

        socket.on('text-change', (data) => {
            const { roomId, fileID, change, clientVersion } = data
            socket.currentFileID = fileID
            const fileSession = editorService.getFileSession(roomId, fileID)
            const result = editorService.updateContent(roomId, fileID, change, fileSession.version)

            if (!result) return

            if (result.conflict) {
                console.log(`Version conflict: client ${clientVersion}, server ${result.session.version}`)
                socket.emit('force-sync', {
                    content: result.session.content,
                    version: result.session.version
                })
                return
            }
            // After updating content
            io.sockets.sockets.forEach((s) => {
                if (s.currentFileID === fileID && s.id !== socket.id) {
                    s.emit('remote-change', {
                        change,
                        socketId: socket.id,
                        version: result.session.version,
                        content: result.session.content
                    })
                }
            })

            socket.emit('change-applied', {
                version: result.session.version
            })
        })

        socket.on('cursor-change', (data) => {
            const { roomId, position, fileID } = data
            socket.currentFileID = fileID
            const cursor = editorService.updateCursor(roomId, socket.id, position, socket.currentFileID)

            if (cursor) {
                io.sockets.sockets.forEach((s) => {
                    if (s.currentFileID === fileID && s.id !== socket.id) {
                        s.emit('cursor-update', {
                            socketId: socket.id,
                            username: socket.username || 'Anonymous',
                            position: cursor
                        })
                    }
                })
            }
        })
        socket.on('switch-file', (data) => {
            const { roomId, newFileID } = data
            socket.currentFileID = newFileID
            const session = editorService.getSession(roomId) || editorService.createSession(roomId)
            const fileSession = editorService.getFileSession(roomId, newFileID)
            const fileCursors = Array.from(session.cursors.values())
                .filter(c => c.fileID === newFileID)
            socket.currentFileVersion = fileSession.version
            socket.emit('editor-init', {
                content: fileSession.content,
                cursors: fileCursors,
                version: fileSession.version
            })
        })
        socket.on('request-sync', (data) => {
            const { roomId } = data
            const session = editorService.getSession(roomId) || editorService.createSession(roomId)
            const fileSession = editorService.getFileSession(roomId, socket.currentFileID)

            if (session) {
                const fileCursors = Array.from(session.cursors.values())
                    .filter(c => c.fileID === socket.currentFileID)
                socket.emit('force-sync', {
                    content: fileSession.content,
                    version: fileSession.version,
                    cursors: fileCursors
                })
            }
        })

        socket.on('selection-change', (data) => {
            const { roomId, selection } = data
            socket.to(roomId).emit('selection-update', {
                socketId: socket.id,
                selection: selection
            })
        })

        socket.on('leave-editor', (roomId) => {
            editorService.removeCursor(roomId, socket.id)
            socket.to(roomId).emit('cursor-remove', {
                socketId: socket.id,
                username: socket.username || 'Anonymous'
            })
        })

        socket.on('disconnect', () => {
            console.log('user disconnected')
            // Remove cursor from all sessions
            editorService.sessions.forEach((session, roomId) => {
                editorService.removeCursor(roomId, socket.id)
                socket.to(roomId).emit('cursor-remove', {
                    socketId: socket.id,
                    username: socket.username || 'Anonymous'
                })
            })
        })
    })

    return io
}