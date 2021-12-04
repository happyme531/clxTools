
function Runtime(){
    this.isNodeJS = typeof process !== 'undefined' && process.versions && process.versions.node;
}

Runtime.prototype.isNodeJS = false;

module.exports = new Runtime();