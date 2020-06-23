const fs = require('fs');
var logger = exports;

logger.dest = './access.log';

logger.init = function(dest = './access.log', customMsg = 'Download server started') {
    this.dest = dest
    fs.appendFileSync(this.dest, time()+'[INIT] '+customMsg+'\n');
    console.log(time()+'[INIT] '+customMsg);
}

logger.succ = function(file, URL) {
    fs.appendFileSync(this.dest, time()+'[SUCC] '+URL+' -> '+file+'\n');
    console.log(time()+'[SUCC] '+URL+' -> '+file);
}

logger.fail = function(file, URL, errmsg) {
    fs.appendFileSync(this.dest, time()+'[FAIL] '+URL+' -> '+file + ': ' + errmsg +'\n');
    console.log(time()+'[FAIL] '+URL+' -> '+file + ': ' + errmsg);
}

function time() {
    let dateObj = new Date();
    return '['+dateObj.getFullYear()+'-'+dateObj.getMonth()+'-'+dateObj.getDate()+' '+dateObj.getHours()+':'+dateObj.getMinutes()+']'
}