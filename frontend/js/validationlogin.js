function validate(form) {
    with(document.forms.login) {
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
}