const jsFileRegexp = /\.js$/;

const mjsFileRegexp = /\.mjs$/;

function isFunction(func) {
    return typeof func === 'function';
}

function isJSFile(file) {
    return jsFileRegexp.test(file);
}
function isMJSFile(file) {
    return mjsFileRegexp.test(file);
}
module.exports = {
    isFunction,
    isJSFile,
    isMJSFile,
};