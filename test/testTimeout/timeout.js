
module.exports = function() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({code: 0});
        },3000)
    })
}