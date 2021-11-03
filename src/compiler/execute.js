const MathUtil = require('../util/math-util.js');
const BlockUtility = require('../engine/block-utility.js');
const blockUtility = new BlockUtility();

const executeScript = (sequencer, thread, functionStr) => {
    // store sequencer and thread so block functions can access them through
    // convenience methods.
    blockUtility.sequencer = sequencer;
    blockUtility.thread = thread;
    
    console.log(blockUtility);
    const func = new Function("util", "MathUtil", functionStr);
    func(blockUtility, MathUtil);
}

module.exports = executeScript;