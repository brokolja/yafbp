/**
 * Helper function that requires a module uncached.
 * 
 * Why: 
 * Node's module system automatically caches modules.
 * This is bad when watching for file-changes,
 * because we always get the cached(old) version of the module.
 * This function always loads the uncached version for us. Use this instead of require('MODULE_NAME')
 * 
 * Example usage:
 * var myData = requireUncached('./myData.js');
 * 
 * @param {module} module
 * @returns undefined
 */
function requireUncached(module){
    delete require.cache[require.resolve(module)]
    return require(module)
}