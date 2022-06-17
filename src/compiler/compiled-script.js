const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;

const requiredSnippet = [];

// Cast
requiredSnippet.push(`
const isWhiteSpace = val => typeof val === 'string' && val.trim().length === 0;
const toBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        if (value === '' || value === '0' || value.toLowerCase() === 'false') {
            return false;
        }
        return true;
    }
    return !!value;
};

const lt = (v1, v2) => {
    let n1 = +v1;
    let n2 = +v2;
    if (n1 === 0 && isWhiteSpace(v1)) n1 = NaN;
    else if (n2 === 0 && isWhiteSpace(v2)) n2 = NaN;
    if (isNaN(n1) || isNaN(n2)) {
        const s1 = ('' + v1).toLowerCase();
        const s2 = ('' + v2).toLowerCase();
        return s1 < s2;
    }
    return n1 < n2;
};

const le = (v1, v2) => {
    let n1 = +v1;
    let n2 = +v2;
    if (n1 === 0 && isWhiteSpace(v1)) n1 = NaN;
    else if (n2 === 0 && isWhiteSpace(v2)) n2 = NaN;
    if (isNaN(n1) || isNaN(n2)) {
        const s1 = ('' + v1).toLowerCase();
        const s2 = ('' + v2).toLowerCase();
        return s1 <= s2;
    }
    return n1 <= n2;
};

const gt = (v1, v2) => {
    let n1 = +v1;
    let n2 = +v2;
    if (n1 === 0 && isWhiteSpace(v1)) {
        n1 = NaN;
    } else if (n2 === 0 && isWhiteSpace(v2)) {
        n2 = NaN;
    }
    if (isNaN(n1) || isNaN(n2)) {
        const s1 = ('' + v1).toLowerCase();
        const s2 = ('' + v2).toLowerCase();
        return s1 > s2;
    }
    return n1 > n2;
};

const ge = (v1, v2) => {
    let n1 = +v1;
    let n2 = +v2;
    if (n1 === 0 && isWhiteSpace(v1)) {
        n1 = NaN;
    } else if (n2 === 0 && isWhiteSpace(v2)) {
        n2 = NaN;
    }
    if (isNaN(n1) || isNaN(n2)) {
        const s1 = ('' + v1).toLowerCase();
        const s2 = ('' + v2).toLowerCase();
        return s1 >= s2;
    }
    return n1 >= n2;
};

const eq = (v1, v2) => {
    const n1 = +v1;
    if (isNaN(n1) || (n1 === 0 && isWhiteSpace(v1))) return ('' + v1).toLowerCase() === ('' + v2).toLowerCase();
    const n2 = +v2;
    if (isNaN(n2) || (n2 === 0 && isWhiteSpace(v2))) return ('' + v1).toLowerCase() === ('' + v2).toLowerCase();
    return n1 === n2;
};
`);

// For motion blocks
// This corresponds to snapToInteger in Scratch 2
requiredSnippet.push(`
const limitPrecision = coordinate => {
    const rounded = Math.round(coordinate);
    const delta = coordinate - rounded;
    return (Math.abs(delta) < 1e-9) ? rounded : coordinate;
}
`);

// For event_broadcast
requiredSnippet.push(`
const startHats = (requestedHat, optMatchFields) => {
    const threads = util.thread.target.runtime.startHats(requestedHat, optMatchFields);
    return threads;
};
`);

// Also for event_broadcast
requiredSnippet.push(`const waitThreads = function* (threads) {
    const thread = util.thread;
    const runtime = thread.target.runtime;

    while (true) {
        let anyRunning = false;
        // 确认是否有线程正在运行,,有则跳出循环
        for (let i = 0; i < threads.length; i++) {
            if (runtime.threads.includes(threads[i])) {
                anyRunning = true;
                break;
            }
        }
        if (!anyRunning) return;

        let allWaiting = true;
        for (let i = 0; i < threads.length; i++) {
            if (!runtime.isWaitingThread(threads[i])) {
                allWaiting = false;
                break;
            }
        }
        if (allWaiting) thread.status = 3; // STATUS_YIELD_TICK
        yield;
    }
};`);

// For control_wait
requiredSnippet.push(`
const timer = () => {
    const t = new globalState.Timer({
        now: () => util.thread.target.runtime.currentMSecs
    });
    t.start();
    return t;
};
`);

// Keep track of promise returned by blocks.
requiredSnippet.push(`
let hasResumedFromPromise = false;
const waitPromise = function* (promise, flag, warp) {
    const isPromise = value => (
        value !== null &&
        typeof value === 'object' &&
        typeof value.then === 'function'
    );
    
    // 对于兼容层来说，应该在一个 StackFrame 中完成，因此需要重置它来避免一些问题
    util.thread.stackFrames[util.thread.stackFrames.length - 1].reuse(warp);
    if (isPromise(promise)) {
        let result = '';
        
        // 如果返回值为 Promise，则对其设置返回值捕捉
        promise.then(value => {
            result = value;
        }).catch(error => {
            console.error('Promise rejected:', error);
        }).finally(() => {
            util.thread.status = 0; // STATUS_RUNNING
        });
        util.thread.status = 1; // STATUS_PROMISE_WAIT
        
        while (result === '') {
            // 被挂起的线程会在下一次迭代中被调用
            if (util.thread.status === 2 /* STATUS_YIELD */) {
                util.thread.status = 0; // STATUS_RUNNING
                if (!warp) yield;
            }
            if (!warp) yield;
        }
        if (flag) hasResumedFromPromise = true;
        return result;
    }
    return promise;
};
`);
class CompiledScript {
    constructor (type = 'script', source) {
        this.type = type;
        this.source = source;
        console.log(`generate ${type}:\n${source}`);
        this.isGenerated = false;
        this.convert();
    }

    convert () {
        if (!this.isGenerated) {
            try {
                this.generator = new GeneratorFunction('util', 'globalState', 'parameter', requiredSnippet.join('') + this.source);
                this.isGenerated = true;
            } catch (e) {
                console.error(`Failed code:\n${this.source}`);
                throw new Error(`Error occured while generating script:\n${e}`);
            }
        }
    }
}

module.exports = CompiledScript;
