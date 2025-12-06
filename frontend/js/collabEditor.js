const socket = io()
const roomId = 'default-room'

// Initialize Ace Editor
const editor = ace.edit("editor")
editor.setTheme("ace/theme/monokai")
editor.session.setMode("ace/mode/python")
editor.session.setUseWrapMode(true)
editor.setReadOnly(true) // Read-only until a file is opened

// State
let currentProject = null
let currentFile = null
let projects = []

// Store remote cursors and sync state
const remoteCursors = new Map()
let isApplyingRemoteChange = false
let clientVersion = 0
let pendingChanges = []

// DOM Elements
const projectListEl = document.getElementById('project-list')
const newProjectBtn = document.getElementById('new-project-btn')
const saveBtn = document.getElementById('save-btn')

// Initialize
function init() {
    loadProjects()
    setupEventListeners()

    // Get username from cookie or session storage
    const username = getUsernameFromSession()

    // Join editor room with username
    socket.emit('join-editor', {
        roomId: roomId,
        username: username
    })
}

function getUsernameFromSession() {
    // Try to get username from a data attribute on the body or a meta tag
    const usernameEl = document.querySelector('meta[name="username"]')
    if (usernameEl) {
        return usernameEl.content
    }
    return 'Anonymous'
}

function setupEventListeners() {
    newProjectBtn.addEventListener('click', handleNewProject)
    saveBtn.addEventListener('click', handleSave)
}

// Project Management
async function loadProjects() {
    try {
        const response = await fetch('/editor/projects')
        const data = await response.json()

        if (data.projects) {
            projects = data.projects
            renderProjects()
        }
    } catch (error) {
        console.error('Error loading projects:', error)
    }
}

function renderProjects() {
    projectListEl.innerHTML = ''

    projects.forEach(project => {
        const projectEl = document.createElement('div')
        projectEl.className = 'project-item'

        const headerEl = document.createElement('div')
        headerEl.className = 'project-header'
        headerEl.innerHTML = `
            <span>${project.name}</span>
            <div>
                <button class="icon-btn add-file-btn" title="New File">+</button>
                <button class="delete-btn delete-project-btn" title="Delete Project">−</button>
            </div>
        `

        const fileListEl = document.createElement('div')
        fileListEl.className = 'file-list'

        if (project.files && project.files.length > 0) {
            project.files.forEach(file => {
                const fileEl = document.createElement('div')
                fileEl.className = `file-item ${currentFile && currentFile._id === file._id ? 'active' : ''}`
                fileEl.innerHTML = `
                    <span style="flex: 1; cursor: pointer;">${file.fname}</span>
                    <button class="delete-btn delete-file-btn" title="Delete File">−</button>
                `

                const fileNameSpan = fileEl.querySelector('span')
                fileNameSpan.onclick = () => {
                    console.log('File clicked:', file.fname, 'Project:', project.name)
                    openFile(project, file)
                }

                const deleteFileBtn = fileEl.querySelector('.delete-file-btn')
                deleteFileBtn.onclick = (e) => {
                    e.stopPropagation()
                    handleDeleteFile(project, file)
                }

                fileListEl.appendChild(fileEl)
            })
        }

        // Add file button handler
        const addBtn = headerEl.querySelector('.add-file-btn')
        addBtn.onclick = (e) => {
            e.stopPropagation()
            handleNewFile(project)
        }

        // Delete project button handler
        const deleteProjectBtn = headerEl.querySelector('.delete-project-btn')
        deleteProjectBtn.onclick = (e) => {
            e.stopPropagation()
            handleDeleteProject(project)
        }

        projectEl.appendChild(headerEl)
        projectEl.appendChild(fileListEl)
        projectListEl.appendChild(projectEl)
    })
}

async function handleNewProject() {
    const projectName = prompt("Enter project name:")
    if (!projectName) return

    try {
        const response = await fetch('/editor/new-project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectName })
        })

        const data = await response.json()
        if (data.success) {
            loadProjects()
        } else {
            alert(data.message || 'Error creating project')
        }
    } catch (error) {
        console.error('Error creating project:', error)
    }
}

async function handleNewFile(project) {
    const fileName = prompt(`Create new file in ${project.name}:`)
    if (!fileName) return

    try {
        const response = await fetch('/editor/create-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectName: project.name,
                fileName: fileName
            })
        })

        const data = await response.json()
        if (data.success) {
            loadProjects()
        } else {
            alert(data.message || 'Error creating file')
        }
    } catch (error) {
        console.error('Error creating file:', error)
    }
}

async function handleDeleteFile(project, file) {
    if (!confirm(`Delete file "${file.fname}"?`)) return

    try {
        const response = await fetch('/editor/delete-file', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectName: project.name,
                fileName: file.fname
            })
        })

        const data = await response.json()
        if (data.success) {
            // If the deleted file was open, clear the editor
            if (currentFile && currentFile._id === file._id) {
                currentFile = null
                currentProject = null
                editor.setValue('', -1)
                editor.setReadOnly(true) // Disable editing when no file is open
            }
            loadProjects()
        } else {
            alert(data.message || 'Error deleting file')
        }
    } catch (error) {
        console.error('Error deleting file:', error)
    }
}

async function handleDeleteProject(project) {
    if (!confirm(`Delete project "${project.name}" and all its files?`)) return

    try {
        const response = await fetch('/editor/delete-project', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectName: project.name
            })
        })

        const data = await response.json()
        if (data.success) {
            // If a file from the deleted project was open, clear the editor
            if (currentProject && currentProject.name === project.name) {
                currentFile = null
                currentProject = null
                editor.setValue('', -1)
                editor.setReadOnly(true) // Disable editing when no file is open
            }
            loadProjects()
        } else {
            alert(data.message || 'Error deleting project')
        }
    } catch (error) {
        console.error('Error deleting project:', error)
    }
}

async function openFile(project, file) {
    console.log('openFile called with:', { project: project.name, file: file.fname })
    try {
        const response = await fetch(`/editor/open/${file.fname}?projectName=${project.name}`)
        const data = await response.json()

        console.log('File data received:', data)

        if (data.contents !== undefined) {
            currentProject = project
            currentFile = file

            // Update editor content
            isApplyingRemoteChange = true
            editor.setValue(data.contents, -1)
            isApplyingRemoteChange = false

            // Save File ID for use by Run button
            const f = data.fileId;
            const p = data.projectId
            editor.setAttribute('data-file-id',f);
            editor.setAttribute('data-project-id',p)

            // Enable editing when file is opened
            editor.setReadOnly(false)

            // Update UI
            renderProjects() // To update active state

            // Set mode based on extension
            const ext = file.fname.split('.').pop()
            if (ext === 'js') editor.session.setMode("ace/mode/javascript")
            else if (ext === 'html') editor.session.setMode("ace/mode/html")
            else if (ext === 'css') editor.session.setMode("ace/mode/css")
            else editor.session.setMode("ace/mode/python")
        }
    } catch (error) {
        console.error('Error opening file:', error)
    }
}

async function handleSave() {
    if (!currentProject || !currentFile) {
        alert('No file open to save')
        return
    }

    const content = editor.getValue()

    try {
        const response = await fetch('/editor/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectName: currentProject.name,
                name: currentFile.fname,
                code: content
            })
        })

        const data = await response.json()
        if (data.success) {
            const originalText = saveBtn.textContent
            saveBtn.textContent = 'Saved!'
            setTimeout(() => saveBtn.textContent = originalText, 2000)
        } else {
            alert('Error saving file')
        }
    } catch (error) {
        console.error('Error saving file:', error)
        alert('Error saving file')
    }
}

// Socket Events
socket.on('editor-init', (data) => {
    console.log('Editor initialized with data:', data)

    // Don't load any content on init - editor should be blank until user picks a file
    // We only sync version and cursor information

    clientVersion = data.version || 0
    updateSyncStatus(`Synced (v${clientVersion})`)

    if (data.cursors && Array.isArray(data.cursors)) {
        data.cursors.forEach(([socketId, cursorData]) => {
            if (socketId && cursorData !== socket.id) {
                addRemoteCursor(socketId, cursorData)
            }
        })
    }
})

editor.on('change', (change) => {
    if (isApplyingRemoteChange) return

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

socket.on('change-applied', (data) => {
    clientVersion = data.version
    pendingChanges = []
    updateSyncStatus(`Synced (v${clientVersion})`)
})

socket.on('force-sync', (data) => {
    console.log('Force sync received:', data)

    // Only sync content if we have a file open
    if (currentFile) {
        isApplyingRemoteChange = true

        // Save cursor position before sync
        const cursorPosition = editor.getCursorPosition()

        editor.setValue(data.content || '', -1)

        // Restore cursor position after sync
        editor.moveCursorToPosition(cursorPosition)

        isApplyingRemoteChange = false
    }

    clientVersion = data.version || 0
    pendingChanges = []

    if (data.cursors && Array.isArray(data.cursors)) {
        data.cursors.forEach(([socketId, cursorData]) => {
            if (socketId && cursorData && socketId !== socket.id) {
                addRemoteCursor(socketId, cursorData)
            }
        })
    }

    updateSyncStatus(`Synced (v${clientVersion})`)
})

editor.selection.on('changeCursor', () => {
    const position = editor.getCursorPosition()
    if (position) {
        socket.emit('cursor-change', {
            roomId: roomId,
            position: position
        })
    }
})

editor.selection.on('changeSelection', () => {
    const selection = editor.selection.toJSON()
    socket.emit('selection-change', {
        roomId: roomId,
        selection: selection
    })
})

socket.on('remote-change', (data) => {
    if (data.socketId === socket.id || !data.change) return

    isApplyingRemoteChange = true

    try {
        const change = data.change

        if (change.action === 'insert') {
            const text = change.lines ? change.lines.join('\n') : change.text
            if (text && change.start) {
                editor.session.insert(change.start, text)
            }
        } else if (change.action === 'remove' && change.start && change.end) {
            editor.session.remove(change)
        }

        clientVersion = data.version || clientVersion
        updateSyncStatus(`Synced (v${clientVersion})`)

    } catch (error) {
        console.error('Error applying remote change:', error)
        socket.emit('request-sync', { roomId: roomId })
    }

    isApplyingRemoteChange = false
})

socket.on('cursor-update', (data) => {
    if (data.socketId !== socket.id && data.position) {
        addRemoteCursor(data.socketId, { ...data.position, username: data.username })
    }
})

socket.on('user-joined', (data) => {
    if (data.socketId !== socket.id) {
        updateUserIndicator(data.socketId, { username: data.username })
    }
})

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
        const displayName = cursorData.username || `User ${socketId.substring(0, 6)}`
        userEl.innerHTML = displayName
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
        statusEl.style.background = status.includes('Syncing') ? 'transparent' : 'transparent'
        statusEl.style.color = status.includes('Syncing') ? '#FFA500' : '#888'
    }
}

editor.renderer.on('afterRender', () => {
    remoteCursors.forEach((cursorData, socketId) => {
        if (cursorData.position) {
            updateCursorPosition(socketId, cursorData.position)
        }
    })
})

window.addEventListener('load', () => {
    init()
    setTimeout(() => {
        socket.emit('request-sync', { roomId: roomId })
    }, 1000)
})

window.addEventListener('beforeunload', () => {
    socket.emit('leave-editor', roomId)
})

socket.on('connect', () => {
    console.log('Connected to server with ID:', socket.id)
    updateSyncStatus('Connecting...')
})

socket.on('disconnect', () => {
    console.log('Disconnected from server')
    updateSyncStatus('Disconnected')
})

