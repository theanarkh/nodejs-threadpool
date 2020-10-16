
module.exports = async function() {
    return await new Promise((resolve) => {
        setTimeout(() => {
            console.log(1, ...arguments);
            resolve();
        },3000)
    })
}