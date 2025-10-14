function validate(form) {
    const signup = document.forms.signup
    const {name, email, password1, password2} = signup
    
    if (name.value === "") {
        alert("Please enter a Name.")
        return false
    }
    else if (email.value === "") {
        alert("Please enter a valid Email.")
        return false
    }
    else if (password1.value === "") {
        alert("Please enter a Password.")
        return false
    }
    else if (password2.value !== password1.value) {
        alert("Passwords do not match.")
        return false
    }
    return true
}