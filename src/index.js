const threadPool = require('./threadPool');

module.exports = {
    constants: require('./constants'),
    config: require('./config'),
    threadPool,
    ...threadPool
};