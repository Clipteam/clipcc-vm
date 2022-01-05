const Thread = require('../engine/thread.js');
const MathUtil = require('../util/math-util.js');
const Cast = require('../util/cast.js')
const BlockUtility = require('../engine/block-utility.js');
const blockUtility = new BlockUtility();

const ioQuery = (runtime, device, func, args) => {
    if (runtime.ioDevices[device] && runtime.ioDevices[device][func]) {
        const devObject = runtime.ioDevices[device];
        return devObject[func].apply(devObject, args);
    }
};

const executeScript = (sequencer, thread, blockId) => {
    // store sequencer and thread so jit code can access them through
    // convenience methods.
    blockUtility.sequencer = sequencer;
    blockUtility.thread = thread;
    
    try {
        // 检测 GeneratorFunction 是否需要初始化
        if (typeof thread.compiledFragment[blockId].func == 'function') {
            const CompilerUtil = {
                util: blockUtility,
                MathUtil,
                Cast,
                blockClass: blockUtility.runtime.blockClass,
                ioQuery
            };
            console.log('CompilerUtil:', CompilerUtil);
            thread.compiledFragment[blockId].func = thread.compiledFragment[blockId].func(CompilerUtil);
        }
        result = thread.compiledFragment[blockId].func.next();
        return result;
        if (result.done) {
            //sequencer.retireThread(thread); // 销毁已完成的进程
            //thread.status = Thread.STATUS_DONE;
        }
    } catch (e) {
        throw new Error(e);
    }
};

module.exports = executeScript;
