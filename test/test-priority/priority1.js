function Priority() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
            console.log('Priority 1');
        },1000)
    })
}

module.exports = Priority;