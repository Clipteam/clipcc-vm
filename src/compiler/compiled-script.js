const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;

const timerSnippet = `const timer = () => {
    const t = new globalState.Timer({
        now: () => util.thread.target.runtime.currentMSecs
    });
    t.start();
    return t;
}
`;
class CompiledScript {
    constructor (type = 'script', source) {
        this.type = type;
        this.source = source;
        this.isGenerated = false;
        this.convert();
    }

    convert () {
        console.log('Converting script...', this);
        if (!this.isGenerated) {
            this.generator = new GeneratorFunction('util', 'globalState', 'parameter', timerSnippet + this.source);
            this.isGenerated = true;
        }
    }
}

module.exports = CompiledScript;
