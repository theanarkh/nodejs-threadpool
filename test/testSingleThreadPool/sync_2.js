
module.exports = async function() {
    return await new Promise((resolve) => {
        setTimeout(() => {
            console.log(2, ...arguments);
            resolve()
        },1000)
    })
}