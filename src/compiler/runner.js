const BlockUtility = require('../engine/block-utility');

class Runner {
    constructor (sequencer, thread) {
        this.sequencer = sequencer;
        this.thread = thread;
    }

    run () {
        if (typeof this.thread.compiledStack.main.generator !== 'object') {
            const blockUtility = new BlockUtility(this.sequencer, this.thread);
            this.thread.compiledStack.main.generator = this.thread.compiledStack.main.generator(blockUtility);
        }
        if (!this.thread.blockContainer.forceNoGlow) {
            this.thread.blockGlowInFrame = this.thread.topBlock;
            this.thread.requestScriptGlowInFrame = true;
        }
        console.log(this.thread.compiledStack);
        return this.thread.compiledStack.main.generator.next();
    }
}

module.exports = Runner;
