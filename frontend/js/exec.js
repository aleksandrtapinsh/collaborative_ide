import dotenv from 'dotenv';

dotenv.config();

const outputwindow = document.getElementById("output-text")

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

document.getElementById("execute-btn").addEventListener("click", async () => {
    try{
            const fid = document.getElementById("editor").getAttribute("data-file-id");
        const pid = document.getElementById("editor").getAttribute("data-project-id");

        const tokenres = await fetch('/editor/execute', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                projectId: pid,
                fileId: fid
            })
        }).then(res => {
            return res.json();
        });

        const token = tokenres.token;
        console.log("TOKEN RESPONSE:", tokenres);
        //Poll submission
        for(let seconds = 0; seconds < 21; seconds++) {
            outputwindow.textContent = `Waiting for run completion (${20 - seconds} seconds remaining until force stop)`
            const finishedAt = await fetch(`${process.env.JUDGE0_URI}/submissions/${encodeURIComponent(token)}?base64_encoded=false&fields=finished_at`)
            .then(res => {
                return res.json();
            })
            .then(data => {
                return data.finished_at;
            });

            if(finishedAt !== null) {
                const output = await fetch(`${process.env.JUDGE0_URI}/submissions/${encodeURIComponent(token)}?base64_encoded=false&fields=stdout,stderr`)
                .then(res => {
                    return res.json();
                })
                .then(data => {
                    return `stdout:\n${data.stdout}\nstderr:${data.stderr}`;
                })
                outputwindow.textContent = output;
                break;
            }
            await sleep(1000);
        }
    // Yes, this is very general error handling, but it does prevent the page from breaking and gives us a lead for debugging if we need it 
    } catch(e) {
        outputwindow.textContent = `An error occured:\n${e}`;
    }
})