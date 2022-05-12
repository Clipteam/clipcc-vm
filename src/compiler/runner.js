const BlockUtility = require('../engine/block-utility');
const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;

class Runner {
    constructor (sequencer, thread) {
        this.sequencer = sequencer;
        this.thread = thread;
    }

    run () {
        if (!(this.thread.compiledStack instanceof GeneratorFunction)) {
            const generator = new GeneratorFunction('util', this.thread.compiledStack);
            this.thread.compiledStack = generator(new BlockUtility(this.sequencer, this.thread));
        }
        this.thread.compiledStack.next();
    }
}

module.exports = Runner;
