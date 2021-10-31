const BlockUtility = require('../engine/block-utility.js');
const MathUtil = require('../util/math-util.js');
/**
 * Single BlockUtility instance reused by execute for every pritimive ran.
 * @const
 */
const blockUtility = new BlockUtility();

const executeJS = (blockUtility, functionStr) => {
    const func = new Function("util", "MathUtil", functionStr);
    func(blockUtility, MathUtil);
}

module.exports = executeJS;