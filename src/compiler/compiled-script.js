const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;

const debugSnippet = `// Debugger statement
console.log(parameter, util.thread.compiledStack);
`;

const timerSnippet = `const timer = () => {
    const t = new globalState.Timer({
        now: () => util.thread.target.runtime.currentMSecs
    });
    t.start();
    return t;
}
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
                this.generator = new GeneratorFunction('util', 'globalState', 'parameter', timerSnippet + promiseLayerSnippet + this.source);
                this.isGenerated = true;
            } catch (e) {
                throw new Error(`Error occured while generating script:\n${e}`);
            }
        }
    }
}

module.exports = CompiledScript;
