export default function() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
            console.log('mjs');
        },3000)
    })
}