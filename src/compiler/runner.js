const BlockUtility = require('../engine/block-utility');
const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;

class Runner {
    constructor (sequencer, thread) {
        this.sequencer = sequencer;
        this.thread = thread;
    }

    initializeProcedures () {
        for (const procedureId in this.thread.procedures) {
            const procedure = this.thread.procedures[procedureId];
            if (typeof procedure !== 'object') {
                const generator = new GeneratorFunction('util', 'procedures', procedure);
                this.thread.procedures[procedureId] = generator(new BlockUtility(this.sequencer, this.thread), this.thread.procedures);
            }
        }
    }

    run () {
        this.initializeProcedures();
        if (typeof this.thread.compiledStack !== 'object') {
            const generator = new GeneratorFunction('util', 'procedures', this.thread.compiledStack);
            this.thread.compiledStack = generator(new BlockUtility(this.sequencer, this.thread), this.thread.procedures);
        }
        if (!this.thread.blockContainer.forceNoGlow) {
            this.thread.blockGlowInFrame = this.thread.topBlock;
            this.thread.requestScriptGlowInFrame = true;
        }
        return this.thread.compiledStack.next();
    }
}

module.exports = Runner;
