function Priority() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
            console.log('Priority 2');
        },2000)
    })
}

module.exports = Priority;