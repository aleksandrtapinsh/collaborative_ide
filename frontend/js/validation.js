const form = document.getElementById("signup")
form.addEventListener("submit", async (event) => {
    event.preventDefault()

    const username = form.elements["username"]
    const email = form.elements["email"]
    const password = form.elements["password"]
    const password2 = form.elements["password2"]


    if (username.value === "") {
        alert("Please enter a Name.")
        return false
    }
    else if (email.value === "") {
        alert("Please enter a valid Email.")
        return false
    }
    else if (password.value === "") {
        alert("Please enter a Password.")
        return false
    }
    else if (password2.value !== password.value) {
        alert("Passwords do not match.")
        return false
    }
    try {
        const res = await fetch("/signUp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username.value, email: email.value, password: password.value })
        });

        if (res.redirected) {
            alert("Signup successful!");
            window.location.href = res.url;
        } else {
            const data = await res.json();
            alert(data.message); // backend error
        }
    } catch (err) {
        console.error(err);
        alert("Server error. Please try again.");
    }
})