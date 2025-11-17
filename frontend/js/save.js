// Save File
document.getElementById("save-btn").addEventListener("click", () => {
    const name = prompt("Enter File Name:")
    const code = editor.getValue()
    const projectName = 'test'
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

    fetch(`/editor/open/${encodeURIComponent(fileName)}`)
    .then(res => {
        return res.json()
    })
    .then(data => {
        const editor = ace.edit("editor")
        editor.session.setValue(data.contents)
    })
    .catch(err => console.error(err))
})