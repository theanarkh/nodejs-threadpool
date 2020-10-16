const { MAX } = require('./constants');
module.exports = async function() {
    let ret = 0;
    let i = 0;
    while(i++ < MAX) {
        ret++;
        Buffer.from(String(Math.random())).toString('base64');
    }
    return ret;
}