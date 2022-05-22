const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;

const castSnippet = `const isWhiteSpace = val => typeof val === 'string' && val.trim().length === 0;

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
`;

const timerSnippet = `const timer = () => {
    const t = new globalState.Timer({
        now: () => util.thread.target.runtime.currentMSecs
    });
    t.start();
    return t;
};
`;

const promiseLayerSnippet = `const waitPromise = function* (promise) {
    const isPromise = value => (
        value !== null &&
        typeof value === 'object' &&
        typeof value.then === 'function'
    );
    if (isPromise(promise)) {
        let result = '';
        promise.then(value => {
            result = value;
        }).catch(error => {
            console.error('Promise rejected:', error);
        });
        while (result === '') {
            yield;
        }
        return result;
    }
    return promise;
};
`;
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
                this.generator = new GeneratorFunction('util', 'globalState', 'parameter', castSnippet + timerSnippet + promiseLayerSnippet + this.source);
                this.isGenerated = true;
            } catch (e) {
                throw new Error(`Error occured while generating script:\n${e}`);
            }
        }
    }
}

module.exports = CompiledScript;
