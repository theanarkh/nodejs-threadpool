export default async function() {
    return await new Promise((resolve) => {
        setTimeout(() => {
            resolve();
            console.log('mjs');
        },3000)
    })
}