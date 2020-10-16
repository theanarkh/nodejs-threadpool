
module.exports = async function() {
    return await new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('done');
        },3000)
    })
} 