const BlockUtility = require('../engine/block-utility');
const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;

class Runner {
    constructor (sequencer, thread) {
        this.sequencer = sequencer;
        this.thread = thread;
    }

    run () {
        if (typeof this.thread.compiledStack !== 'object') {
            const generator = new GeneratorFunction('util', this.thread.compiledStack);
            this.thread.compiledStack = generator(new BlockUtility(this.sequencer, this.thread));
        }
        if (!this.thread.blockContainer.forceNoGlow) {
            this.thread.blockGlowInFrame = this.thread.topBlock;
            this.thread.requestScriptGlowInFrame = true;
        }
        return this.thread.compiledStack.next();
    }
}

module.exports = Runner;
