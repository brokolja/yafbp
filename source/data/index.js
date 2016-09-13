var requireUncached = require('./tools/requireUncached.js'); // Use requireUncached instead of require to get uncached-version of module/data.

module.exports = {
    // The following example data is accessible in all templates.
    build : {
        date : new Date()
    }
}