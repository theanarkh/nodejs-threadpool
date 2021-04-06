function es6() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
            console.log('es6');
        },3000)
    })
}

exports.default = es6;