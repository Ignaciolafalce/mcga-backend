//null or empty property
function isNullOrEmpty(property) {
    if (property === null || property === "") {
        return true;
    }
    return false;
}

//null or empty properties
function arrayHasNullOrEmpty(properties) {
    properties.forEach(property => {
        if (isNullOrEmpty(property)) {
            return true;
        }
    });
    return false;
}

function isEmailValid(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}

module.exports = {
    isNullOrEmpty,
    arrayHasNullOrEmpty,
    isEmailValid
};