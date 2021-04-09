function Priority() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
            console.log('Priority 3');
        },3000)
    })
}

module.exports = Priority;