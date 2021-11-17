const Thread = require('../engine/thread.js');
const MathUtil = require('../util/math-util.js');
const BlockUtility = require('../engine/block-utility.js');
const Cast = require('../util/cast.js');
const blockUtility = new BlockUtility();

const executeScript = (sequencer, thread) => {
    // store sequencer and thread so jit code can access them through
    // convenience methods.
    blockUtility.sequencer = sequencer;
    blockUtility.thread = thread;
    
    try {
        if (!thread.isActivated) {
            const CompilerUtil = {
                util: blockUtility,
                MathUtil,
                Cast,
                blockClass: blockUtility.runtime.blockClass
            }
            console.log('CompilerUtil:', CompilerUtil);
            thread.jitFunc = thread.jitFunc(CompilerUtil);
            thread.isActivated = true;
        }
        result = thread.jitFunc.next();
        console.log('运行状态：', result);
        if (result.done) {
            sequencer.retireThread(thread); // 销毁已完成的进程
            thread.status = Thread.STATUS_DONE;
        }
    } catch (e) {
        throw new Error(e);
    }
};

module.exports = executeScript;
