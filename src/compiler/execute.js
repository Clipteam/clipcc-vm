const MathUtil = require('../util/math-util.js');
const BlockUtility = require('../engine/block-utility.js');
const blockUtility = new BlockUtility();

const executeScript = (sequencer, thread) => {
    // store sequencer and thread so block functions can access them through
    // convenience methods.
    blockUtility.sequencer = sequencer;
    blockUtility.thread = thread;
    
    console.log(blockUtility);
    const func = new Function("util", "MathUtil", thread.code);
    try {
        func(blockUtility, MathUtil);
    } catch (e) {
        throw new Error(e);
    }
}

module.exports = executeScript;