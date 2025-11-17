const socket = io()
        const roomId = 'default-room'
        
        // Initialize Ace Editor
        const editor = ace.edit("editor")
        editor.setTheme("ace/theme/monokai")
        editor.session.setMode("ace/mode/python")
        editor.session.setUseWrapMode(true)
        
        // Store remote cursors and sync state
        const remoteCursors = new Map()
        let isApplyingRemoteChange = false
        let clientVersion = 0
        let pendingChanges = []
        
        // Join editor room
        socket.emit('join-editor', roomId)
        
        // Handle editor initialization
        socket.on('editor-init', (data) => {
            console.log('Editor initialized with data:', data)
            
            // Only set content if it's different from current
            const currentContent = editor.getValue()
            if (data.content !== currentContent) {
                console.log('Setting initial content from server')
                isApplyingRemoteChange = true
                editor.setValue(data.content, -1)
                isApplyingRemoteChange = false
            }
            
            clientVersion = data.version || 0
            updateSyncStatus(`Synced (v${clientVersion})`)
            
            // Safely initialize remote cursors
            if (data.cursors && Array.isArray(data.cursors)) {
                data.cursors.forEach(([socketId, cursorData]) => {
                    if (socketId && cursorData !== socket.id) {
                        addRemoteCursor(socketId, cursorData)
                    }
                })
            }
        })
        
        // Listen for local changes and broadcast them
        editor.on('change', (change) => {
            if (isApplyingRemoteChange) return
            
            // Only broadcast if it's a valid change
            if (change && change.action) {
                pendingChanges.push(change)
                
                socket.emit('text-change', {
                    roomId: roomId,
                    change: change,
                    clientVersion: clientVersion
                })
                
                updateSyncStatus(`Syncing... (v${clientVersion})`)
            }
        })
        
        // Handle change applied confirmation from server
        socket.on('change-applied', (data) => {
            clientVersion = data.version
            pendingChanges = [] // Clear pending changes since server accepted them
            updateSyncStatus(`Synced (v${clientVersion})`)
        })
        
        // Handle force sync (when server detects conflict)
        socket.on('force-sync', (data) => {
            console.log('Force sync received:', data)
            isApplyingRemoteChange = true
            
            // Replace local content with server content
            editor.setValue(data.content || '', -1)
            clientVersion = data.version || 0
            pendingChanges = []
            
            // Update cursors if provided
            if (data.cursors && Array.isArray(data.cursors)) {
                data.cursors.forEach(([socketId, cursorData]) => {
                    if (socketId && cursorData && socketId !== socket.id) {
                        addRemoteCursor(socketId, cursorData)
                    }
                })
            }
            
            isApplyingRemoteChange = false
            updateSyncStatus(`Synced (v${clientVersion})`)
        })
        
        // Listen for cursor movement and broadcast
        editor.selection.on('changeCursor', () => {
            const position = editor.getCursorPosition()
            if (position) {
                socket.emit('cursor-change', {
                    roomId: roomId,
                    position: position
                })
            }
        })
        
        // Listen for selection changes
        editor.selection.on('changeSelection', () => {
            const selection = editor.selection.toJSON()
            socket.emit('selection-change', {
                roomId: roomId,
                selection: selection
            })
        })
        
        // Handle remote changes
        socket.on('remote-change', (data) => {
            if (data.socketId === socket.id || !data.change) return
            
            isApplyingRemoteChange = true
            
            try {
                const change = data.change
                
                // Apply the remote change to our editor
                if (change.action === 'insert') {
                    const text = change.lines ? change.lines.join('\n') : change.text
                    if (text && change.start) {
                        editor.session.insert(change.start, text)
                    }
                } else if (change.action === 'remove' && change.start && change.end) {
                    editor.session.remove(change)
                }
                
                // Update client version
                clientVersion = data.version || clientVersion
                updateSyncStatus(`Synced (v${clientVersion})`)
                
            } catch (error) {
                console.error('Error applying remote change:', error)
                // Request sync if there's an error
                socket.emit('request-sync', { roomId: roomId })
            }
            
            isApplyingRemoteChange = false
        })
        
        // Handle remote cursor updates
        socket.on('cursor-update', (data) => {
            if (data.socketId !== socket.id && data.position) {
                addRemoteCursor(data.socketId, data.position)
            }
        })
        
        // Handle cursor removal
        socket.on('cursor-remove', (data) => {
            if (data.socketId) {
                removeRemoteCursor(data.socketId)
            }
        })
        
        // Helper functions
        function addRemoteCursor(socketId, cursorData) {
            if (!socketId || !cursorData) return
            
            removeRemoteCursor(socketId)
            
            const cursorEl = document.createElement('div')
            cursorEl.className = 'remote-cursor'
            cursorEl.style.borderColor = cursorData.color || '#FF6B6B'
            cursorEl.id = `cursor-${socketId}`
            
            document.getElementById('editor').appendChild(cursorEl)
            remoteCursors.set(socketId, { 
                element: cursorEl, 
                color: cursorData.color,
                position: cursorData 
            })
            
            updateCursorPosition(socketId, cursorData)
            updateUserIndicator(socketId, cursorData)
        }
        
        function updateCursorPosition(socketId, position) {
            const cursorData = remoteCursors.get(socketId)
            if (!cursorData || !position) return
            
            try {
                const renderer = editor.renderer
                const pos = renderer.textToScreenCoordinates(position.row, position.column)
                
                if (pos) {
                    cursorData.element.style.left = pos.pageX + 'px'
                    cursorData.element.style.top = pos.pageY + 'px'
                    cursorData.position = position
                }
            } catch (error) {
                console.error('Error updating cursor position:', error)
            }
        }
        
        function removeRemoteCursor(socketId) {
            const cursorData = remoteCursors.get(socketId)
            if (cursorData && cursorData.element.parentNode) {
                cursorData.element.parentNode.removeChild(cursorData.element)
            }
            remoteCursors.delete(socketId)
            removeUserIndicator(socketId)
        }
        
        function updateUserIndicator(socketId, cursorData) {
            let userList = document.getElementById('user-list')
            if (!userList) return
            
            let userEl = document.getElementById(`user-${socketId}`)
            if (!userEl) {
                userEl = document.createElement('div')
                userEl.id = `user-${socketId}`
                userEl.className = 'user-item'
                userEl.innerHTML = `User ${socketId.substring(0, 6)}`
                userEl.style.color = cursorData.color || '#FF6B6B'
                userList.appendChild(userEl)
            }
        }
        
        function removeUserIndicator(socketId) {
            const userEl = document.getElementById(`user-${socketId}`)
            if (userEl && userEl.parentNode) {
                userEl.parentNode.removeChild(userEl)
            }
        }
        
        function updateSyncStatus(status) {
            const statusEl = document.getElementById('sync-status')
            if (statusEl) {
                statusEl.textContent = status
                statusEl.style.background = status.includes('Syncing') ? '#FFA500' : '#4CAF50'
            }
        }
        
        // Update cursor positions on editor resize or scroll
        editor.renderer.on('afterRender', () => {
            remoteCursors.forEach((cursorData, socketId) => {
                if (cursorData.position) {
                    updateCursorPosition(socketId, cursorData.position)
                }
            })
        })
        
        // Request sync on page load to ensure we're up to date
        window.addEventListener('load', () => {
            setTimeout(() => {
                socket.emit('request-sync', { roomId: roomId })
            }, 1000)
        })
        
        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            socket.emit('leave-editor', roomId)
        })
        
        // Debug: Log connection status
        socket.on('connect', () => {
            console.log('Connected to server with ID:', socket.id)
            updateSyncStatus('Connecting...')
        })
        
        socket.on('disconnect', () => {
            console.log('Disconnected from server')
            updateSyncStatus('Disconnected')
        })