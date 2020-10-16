const http = require('http');
const { ROUND }= require('./constants');

function round(count) {
    return new Promise((reslove) => {
        let i = 0;
        let resCount = 0;
        let cost = 0;
        while(i++ < count) {
            const start = Date.now();
            http.request({
                host: '127.0.0.1',
                port: 9297
            }, function(res) {
                res.on('data', function() {
                    // nothing to do，for emit end event
                });
                res.on('end', function() {
                    cost += (Date.now() - start);
                    resCount++;
                    if (resCount === count) {
                        reslove(+(cost / count).toFixed(2));
                    }
                });
            }).end();
        }
    })
}
async function main() {
    let i = 0;
    let count = 0;
    const data = [];
    while(i++ < ROUND) {
        count += 20;
        const cost = await round(count);
        data.push(cost);
    }
    console.log(data)
    process.exit(0);
}

main();