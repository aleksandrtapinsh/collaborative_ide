document.getElementById("save-btn").addEventListener("click", () => {
    const name = prompt("Enter File Name:")
    const code = editor.getValue();
    const projectName = 'test'
    fetch("/editor/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ code, name, projectName })
    })
    .then(res => res.json())
    .then(data => console.log("Saved:", data))
    .catch(err => console.error(err));
});