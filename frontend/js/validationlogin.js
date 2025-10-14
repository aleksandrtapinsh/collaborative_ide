function validate() {
    const signup = document.forms.signup
    const {name, email, password1, password2} = signup

    if (email.value === "") {
        alert("Please enter a valid Email.")
        return false
    }
    else if (password.value === "") {
        alert("Please enter a Password.")
        return false
    }
    return false
}