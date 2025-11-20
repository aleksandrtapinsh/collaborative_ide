class EditorSessionService {
    constructor() {
        this.sessions = new Map()
    }

    getSession(roomId) {
        return this.sessions.get(roomId)
    }

    createSession(roomId) {
        if (!this.sessions.has(roomId)) {
            this.sessions.set(roomId, {
                content: '',
                cursors: new Map(),
                version: 0,
                lastAppliedChange: null
            })
        }
        return this.sessions.get(roomId)
    }

    updateContent(roomId, change, clientVersion) {
        const session = this.getSession(roomId)
        
        if (!session) return null

        if (clientVersion !== session.version) {
            return { conflict: true, session }
        }

        session.content = this.applyChange(session.content, change)
        session.version++
        session.lastAppliedChange = change

        return { conflict: false, session }
    }

    updateCursor(roomId, socketId, position) {
        const session = this.getSession(roomId)
        
        if (!session) return null

        if (!session.cursors) {
            session.cursors = new Map()
        }

        session.cursors.set(socketId, {
            ...position,
            socketId,
            color: this.generateColor(socketId),
            lastUpdate: Date.now()
        })

        this.cleanupOldCursors(session.cursors)

        return session.cursors.get(socketId)
    }

    removeCursor(roomId, socketId) {
        const session = this.getSession(roomId)
        if (session && session.cursors) {
            session.cursors.delete(socketId)
        }
    }

    applyChange(content, change) {
        if (!content) content = ''
        if (!change) return content

        const lines = content.split('\n')

        try {
            if (change.action === 'insert') {
                const { row, column } = change.start
                const textToInsert = change.lines ? change.lines.join('\n') : change.text

                if (!textToInsert) return content

                while (lines.length <= row) {
                    lines.push('')
                }

                const line = lines[row] || ''
                lines[row] = line.slice(0, column) + textToInsert + line.slice(column)

            } else if (change.action === 'remove') {
                const start = change.start
                const end = change.end

                if (start.row === end.row) {
                    if (lines[start.row]) {
                        const line = lines[start.row]
                        lines[start.row] = line.slice(0, start.column) + line.slice(end.column)
                    }
                } else {
                    const firstLine = lines[start.row] || ''
                    const lastLine = lines[end.row] || ''
                    const newLine = firstLine.slice(0, start.column) + lastLine.slice(end.column)

                    lines.splice(start.row, end.row - start.row + 1, newLine)
                }
            }
        } catch (error) {
            console.error('Error applying change:', error)
            return content
        }

        return lines.join('\n')
    }

    cleanupOldCursors(cursors) {
        const now = Date.now()
        const maxAge = 30000

        for (let [socketId, cursor] of cursors) {
            if (now - cursor.lastUpdate > maxAge) {
                cursors.delete(socketId)
            }
        }
    }

    generateColor(socketId) {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ]
        const index = socketId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
        return colors[index]
    }
}
export default new EditorSessionService()