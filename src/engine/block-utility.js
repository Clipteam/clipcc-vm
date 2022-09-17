const Thread = require('./thread');
const Timer = require('../util/timer');
const Cast = require('../util/cast');

/**
 * @fileoverview
 * Interface provided to block primitive functions for interacting with the
 * runtime, thread, target, and convenient methods.
 */

const isPromise = function (value) {
    return (
        value !== null &&
        typeof value === 'object' &&
        typeof value.then === 'function'
    );
};

class BlockUtility {
    constructor (sequencer = null, thread = null, block = null) {
        /**
         * A sequencer block primitives use to branch or start procedures with
         * @type {?Sequencer}
         */
        this.sequencer = sequencer;

        /**
         * The block primitives thread with the block's target, stackFrame and
         * modifiable status.
         * @type {?Thread}
         */
        this.thread = thread;

        this.currentBlock = block;

        this._nowObj = {
            now: () => this.sequencer.runtime.currentMSecs
        };
    }

    /**
     * The target the primitive is working on.
     * @type {Target}
     */
    get target () {
        return this.thread.target;
    }

    /**
     * The runtime the block primitive is running in.
     * @type {Runtime}
     */
    get runtime () {
        return this.sequencer.runtime;
    }

    /**
     * Use the runtime's currentMSecs value as a timestamp value for now
     * This is useful in some cases where we need compatibility with Scratch 2
     * @type {function}
     */
    get nowObj () {
        if (this.runtime) {
            return this._nowObj;
        }
        return null;
    }

    /**
     * The stack frame used by loop and other blocks to track internal state.
     * @type {object}
     */
    get stackFrame () {
        const frame = this.thread.peekStackFrame();
        if (frame.executionContext === null) {
            frame.executionContext = {};
        }
        return frame.executionContext;
    }

    get currentBlockId () {
        return this.currentBlock.id;
    }

    /**
     * Check the stack timer and return a boolean based on whether it has finished or not.
     * @return {boolean} - true if the stack timer has finished.
     */
    stackTimerFinished () {
        const timeElapsed = this.stackFrame.timer.timeElapsed();
        if (timeElapsed < this.stackFrame.duration) {
            return false;
        }
        return true;
    }

    /**
     * Check if the stack timer needs initialization.
     * @return {boolean} - true if the stack timer needs to be initialized.
     */
    stackTimerNeedsInit () {
        return !this.stackFrame.timer;
    }

    /**
     * Create and start a stack timer
     * @param {number} duration - a duration in milliseconds to set the timer for.
     */
    startStackTimer (duration) {
        if (this.nowObj) {
            this.stackFrame.timer = new Timer(this.nowObj);
        } else {
            this.stackFrame.timer = new Timer();
        }
        this.stackFrame.timer.start();
        this.stackFrame.duration = duration;
    }

    /**
     * Set the thread to yield.
     */
    yield () {
        this.thread.status = Thread.STATUS_YIELD;
    }

    /**
     * Set the thread to yield until the next tick of the runtime.
     */
    yieldTick () {
        this.thread.status = Thread.STATUS_YIELD_TICK;
    }

    /**
     * Start a branch in the current block.
     * @param {number} branchNum Which branch to step to (i.e., 1, 2).
     * @param {boolean} isLoop Whether this block is a loop.
     */
    startBranch (branchNum, isLoop) {
        this.sequencer.stepToBranch(this.thread, branchNum, isLoop);
    }

    /**
     * Stop all threads.
     */
    stopAll () {
        this.sequencer.runtime.stopAll();
    }

    /**
     * Stop threads other on this target other than the thread holding the
     * executed block.
     */
    stopOtherTargetThreads () {
        this.sequencer.runtime.stopForTarget(this.thread.target, this.thread);
    }

    /**
     * Stop this thread.
     */
    stopThisScript () {
        this.thread.stopThisScript();
    }

    /**
     * Start a specified procedure on this thread.
     * @param {string} procedureCode Procedure code for procedure to start.
     */
    startProcedure (procedureCode) {
        this.sequencer.stepToProcedure(this.thread, procedureCode);
    }

    /**
     * Report a value to current thread.
     * @param {*} value Reported value to push.
     */
    pushReportedValue (value) {
        this.thread.pushReportedValue(value);
    }

    /**
     * Get names and ids of parameters for the given procedure.
     * @param {string} procedureCode Procedure code for procedure to query.
     * @return {Array.<string>} List of param names for a procedure.
     */
    getProcedureParamNamesAndIds (procedureCode) {
        const ret = this.thread.blockContainer.getProcedureParamNamesAndIds(procedureCode);
        if (!ret) return this.sequencer.runtime.getProcedureParamNamesAndIds(procedureCode);
        return ret;
    }

    /**
     * Get names, ids, and defaults of parameters for the given procedure.
     * @param {string} procedureCode Procedure code for procedure to query.
     * @return {Array.<string>} List of param names for a procedure.
     */
    getProcedureParamNamesIdsAndDefaults (procedureCode) {
        const ret = this.thread.blockContainer.getProcedureParamNamesIdsAndDefaults(procedureCode);
        if (!ret) return this.sequencer.runtime.getProcedureParamNamesIdsAndDefaults(procedureCode);
        return ret;
        
    }

    /**
     * Initialize procedure parameters in the thread before pushing parameters.
     */
    initParams () {
        this.thread.initParams();
    }

    /**
     * Store a procedure parameter value by its name.
     * @param {string} paramName The procedure's parameter name.
     * @param {*} paramValue The procedure's parameter value.
     */
    pushParam (paramName, paramValue) {
        this.thread.pushParam(paramName, paramValue);
    }

    /**
     * Retrieve the stored parameter value for a given parameter name.
     * @param {string} paramName The procedure's parameter name.
     * @return {*} The parameter's current stored value.
     */
    getParam (paramName) {
        return this.thread.getParam(paramName);
    }

    /**
     * Start all relevant hats.
     * @param {!string} requestedHat Opcode of hats to start.
     * @param {object=} optMatchFields Optionally, fields to match on the hat.
     * @param {Target=} optTarget Optionally, a target to restrict to.
     * @return {Array.<Thread>} List of threads started by this function.
     */
    startHats (requestedHat, optMatchFields, optTarget) {
        // Store thread and sequencer to ensure we can return to the calling block's context.
        // startHats may execute further blocks and dirty the BlockUtility's execution context
        // and confuse the calling block when we return to it.
        const callerThread = this.thread;
        const callerSequencer = this.sequencer;
        const result = this.sequencer.runtime.startHats(requestedHat, optMatchFields, optTarget);

        // Restore thread and sequencer to prior values before we return to the calling block.
        this.thread = callerThread;
        this.sequencer = callerSequencer;

        return result;
    }

    /**
     * Query a named IO device.
     * @param {string} device The name of like the device, like keyboard.
     * @param {string} func The name of the device's function to query.
     * @param {Array.<*>} args Arguments to pass to the device's function.
     * @return {*} The expected output for the device's function.
     */
    ioQuery (device, func, args) {
        // Find the I/O device and execute the query/function call.
        if (
            this.sequencer.runtime.ioDevices[device] &&
            this.sequencer.runtime.ioDevices[device][func]) {
            const devObject = this.sequencer.runtime.ioDevices[device];
            return devObject[func].apply(devObject, args);
        }
    }
}

class CompiledBlockUtility extends BlockUtility {
    constructor (...params) {
        super(...params);
        this.refreshCounter = 0;
    }
    
    /**
     * Create a new timer then return it.
     * @returns {Timer} a timer instance.
     */
    getTimer () {
        const t = new Timer({
            now: () => this.thread.target.runtime.currentMSecs
        });
        t.start();
        return t;
    }
    
    /**
     * Whether need to be refresh for prevent render thread being blocked.
     * @returns {boolean}
     */
    needRefresh () {
        this.refreshCounter++;
        if (this.refreshCounter >= 100) {
            this.refreshCounter = 0;
            // src/engine/sequencer.js:63
            return this.thread.target.runtime.sequencer.timer.timeElapsed() > 500;
        }
        return false;
    }
    
    /**
     * Try to simulate an environment that is as close to the original operating mode as possible to run a certain block.
     * This method should only be used without special compilation optimizations for this block.
     * @param {string} opcode - block's opcode
     * @param {object} inputs - block's arguments
     * @param {boolean} isWarp - Whether to run without refreshing the screen
     * @returns {any} The return value of the block.
     */
    * runInCompatibilityLayer (opcode, inputs, isWarp) {
        // just use it one time, we should reset it to avoid issues
        this.thread.stackFrames[this.thread.stackFrames.length - 1].reuse(isWarp);
        
        // get block function
        const blockFunction = this.runtime.getOpcodeFunction(opcode);
        if (!blockFunction) {
            console.warn('no-op block ' + opcode, ', skip it.');
            return;
        }
        
        let reported = blockFunction(inputs, this);
        // Set callbacks for promise blocks
        if (isPromise(reported)) {
            reported.then(value => {
                this.thread.status = Thread.STATUS_RUNNING;
                reported = value;
            }).catch(e => {
                this.thread.status = Thread.STATUS_RUNNING;
                console.error('Promise rejected in compatibility layer:', e);
                reported = null;
            });
            this.thread.status = Thread.STATUS_PROMISE_WAIT;
        }
        
        while (this.thread.status !== Thread.STATUS_RUNNING) {
            if (this.thread.status === Thread.STATUS_YIELD_TICK) {
                // always yield when It's yield tick.
                yield;
                reported = blockFunction(inputs, this);
            } else if (this.thread.status === Thread.STATUS_YIELD) {
                this.thread.status = Thread.STATUS_RUNNING;
                if (!isWarp || this.needRefresh()) yield;
                reported = blockFunction(inputs, this);
            } else {
                // It's a promise, yield it.
                if (!isWarp || this.needRefresh()) yield;
            }
        }
        
        return reported;
    }
    
    /**
     * waiting until all threads specified have completed execution.
     * params {Thread[]} threads - All threads that need to be waited
     */
    * waitThreads (threads) {
        const { runtime } = this.sequencer;
        while (true) {
            let isFinished = true;
            for (const thread of threads) {
                if (runtime.threads.includes(thread)) {
                    isFinished = false;
                    break;
                }
            }
            if (isFinished) return;
            let allWaiting = true;
            for (const thread of threads) {
                if (!runtime.isWaitingThread(thread)) {
                    allWaiting = false;
                    break;
                }
            }
        if (allWaiting) thread.status = Thread.STATUS_YIELD_TICK;
        yield;
        }
    }
    
    yield () {
        this.thread.status = Thread.STATUS_YIELD;
    }
    
    toBoolean (value) {
        return Cast.toBoolean(value);
    }
    
    lt (v1, v2) {
        let n1 = +v1;
        let n2 = +v2;
        if (n1 === 0 && Cast.isWhiteSpace(v1)) n1 = NaN;
        else if (n2 === 0 && Cast.isWhiteSpace(v2)) n2 = NaN;
        if (isNaN(n1) || isNaN(n2)) {
            const s1 = ('' + v1).toLowerCase();
            const s2 = ('' + v2).toLowerCase();
            return s1 < s2;
        }
        return n1 < n2;
    }
    
    le (v1, v2) {
        let n1 = +v1;
        let n2 = +v2;
        if (n1 === 0 && Cast.isWhiteSpace(v1)) n1 = NaN;
        else if (n2 === 0 && Cast.isWhiteSpace(v2)) n2 = NaN;
        if (isNaN(n1) || isNaN(n2)) {
            const s1 = ('' + v1).toLowerCase();
            const s2 = ('' + v2).toLowerCase();
            return s1 <= s2;
        }
        return n1 <= n2;
    }
    
    gt (v1, v2) {
        let n1 = +v1;
        let n2 = +v2;
        if (n1 === 0 && Cast.isWhiteSpace(v1)) n1 = NaN;
        else if (n2 === 0 && Cast.isWhiteSpace(v2)) n2 = NaN;
        if (isNaN(n1) || isNaN(n2)) {
            const s1 = ('' + v1).toLowerCase();
            const s2 = ('' + v2).toLowerCase();
            return s1 > s2;
        }
        return n1 > n2;
    }
    
    ge (v1, v2) {
        let n1 = +v1;
        let n2 = +v2;
        if (n1 === 0 && Cast.isWhiteSpace(v1)) n1 = NaN;
        else if (n2 === 0 && Cast.isWhiteSpace(v2)) n2 = NaN;
        if (isNaN(n1) || isNaN(n2)) {
            const s1 = ('' + v1).toLowerCase();
            const s2 = ('' + v2).toLowerCase();
            return s1 >= s2;
        }
        return n1 >= n2;
    }
    
    eq (v1, v2) {
        const n1 = +v1;
        if (isNaN(n1) || (n1 === 0 && Cast.isWhiteSpace(v1))) return ('' + v1).toLowerCase() === ('' + v2).toLowerCase();
        const n2 = +v2;
        if (isNaN(n2) || (n2 === 0 && Cast.isWhiteSpace(v2))) return ('' + v1).toLowerCase() === ('' + v2).toLowerCase();
        return n1 === n2;
    }
}

module.exports = {
    BlockUtility,
    CompiledBlockUtility
};
