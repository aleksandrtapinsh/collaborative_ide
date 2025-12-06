const login = document.forms.login
login.addEventListener('submit', async (error) => {
    error.preventDefault()
    const { email, password } = login

    if (email.value === "") {
        alert("Please enter a valid Email.")
        return false
    }
    else if (password.value === "") {
        alert("Please enter a Password.")
        return false
    }
    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.value, password: password.value })
    })

    const data = await response.json()
    if (!data.success) {
        alert(data.message)  // "Invalid Local Login" or "Account Doesn't Exist"
    } else {
        window.location.href = '/editor'
    }
})
