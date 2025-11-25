const projectsSelect = document.getElementById("projects")

// Save File
document.getElementById("save-btn").addEventListener("click", () => {
    const name = prompt("Enter File Name:")
    const code = editor.getValue();
    const projectName = projectsSelect.value
    fetch("/editor/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ code, name, projectName })
    })
    .then(res => res.json())
    .then(data => console.log("Saved:", data))
    .catch(err => console.error(err))
})

// Open File
document.getElementById("open-btn").addEventListener("click", () => {
    const fileName = prompt("Enter file name:")
    if (!fileName) { return }

    fetch(`/editor/open/${encodeURIComponent(fileName)}?projectName=${projectsSelect.value}`)
        .then(res => {
            console.log("response received")
            return res.json()
        })
        .then(data => {
            console.log("Recieved:", data.fileName)
            console.log("Contents:", data.contents)
            const editor = ace.edit("editor")
            editor.setValue(data.contents, -1) // -1 to move cursor to start
        })
        .catch(err => console.error(err))
})

// New Project
document.getElementById("new-project-btn").addEventListener("click", () => {
    const projectName = prompt("Enter Project Name:")
    if (!projectName) { return }

    fetch("/editor/new-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ projectName })
    })
        .then(res => res.json())
        .then(data => {
            console.log("Project Created:", data)
            loadProjects();
        })
        .catch(err => console.error(err))
})

//Load Projects
function loadProjects() {
    fetch("/editor/projects", { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            console.log("Data from backend: ", data)
            projectsSelect.innerHTML = ""
            data.projects.forEach(project => {
                console.log("Adding project:", project.name)
                const option = document.createElement("option")
                option.value = project.name
                option.textContent = project.name
                projectsSelect.appendChild(option)
            })
        })
        .catch(err => console.error(err))
}
document.addEventListener("DOMContentLoaded", () => {
    loadProjects();
});