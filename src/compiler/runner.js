const BlockUtility = require('../engine/block-utility');
const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;

class Runner {
    constructor (sequencer, thread) {
        this.sequencer = sequencer;
        this.thread = thread;
    }

    run () {
        if (typeof this.thread.compiledStack !== 'object') {
            console.log('Seems that it is not a generator function, let me convert it.');
            const generator = new GeneratorFunction('util', this.thread.compiledStack);
            this.thread.compiledStack = generator(new BlockUtility(this.sequencer, this.thread));
        }
        return this.thread.compiledStack.next();
    }
}

module.exports = Runner;
