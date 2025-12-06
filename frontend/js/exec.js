const outputwindow = document.getElementById("output-text")

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

document.getElementById("execute-btn").addEventListener("click", async () => {
    try {
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
        for (let seconds = 0; seconds < 21; seconds++) {
            outputwindow.textContent = `Waiting for run completion (${20 - seconds} seconds remaining until force stop)`

            try {
                const statusResponse = await fetch(`http://34.46.207.241:2358/submissions/${encodeURIComponent(token)}?base64_encoded=false&fields=finished_at`);
                const statusText = await statusResponse.text();

                if (!statusText || statusText.trim() === '') {
                    console.log('Empty response, retrying...');
                    await sleep(1000);
                    continue;
                }

                const statusData = JSON.parse(statusText);
                const finishedAt = statusData.finished_at;

                if (finishedAt !== null) {
                    const outputResponse = await fetch(`http://34.46.207.241:2358/submissions/${encodeURIComponent(token)}?base64_encoded=false&fields=stdout,stderr`);
                    const outputText = await outputResponse.text();

                    if (!outputText || outputText.trim() === '') {
                        outputwindow.textContent = 'Error: Empty response from Judge0';
                        break;
                    }

                    const data = JSON.parse(outputText);

                    // Combine stdout and stderr, showing only non-empty ones
                    let result = '';
                    if (data.stdout) {
                        result += data.stdout;
                    }
                    if (data.stderr) {
                        if (result) result += '\n';
                        result += data.stderr;
                    }

                    outputwindow.textContent = result || '(no output)';
                    break;
                }
            } catch (parseError) {
                console.error('Parse error:', parseError);
                outputwindow.textContent = `Parse error: ${parseError.message}`;
                break;
            }

            await sleep(1000);
        }
        // Yes, this is very general error handling, but it does prevent the page from breaking and gives us a lead for debugging if we need it 
    } catch (e) {
        outputwindow.textContent = `An error occured:\n${e}`;
    }
})