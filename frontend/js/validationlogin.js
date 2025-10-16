function validate() {
    const signup = document.forms.login
    const {email, password} = signup

    if (email.value === "") {
        alert("Please enter a valid Email.")
        return false
    }
    else if (password.value === "") {
        alert("Please enter a Password.")
        return false
    }
    return true
}