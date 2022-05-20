const BlockUtility = require('../engine/block-utility');

class Runner {
    constructor (sequencer, thread) {
        this.sequencer = sequencer;
        this.thread = thread;
    }

    run () {
        // 如果生成器函数还没有变成生成器
        if (typeof this.thread.compiledStack.main.generator !== 'object') {
            // 创建运行必须的 BlockUtility 对象
            const blockUtility = new BlockUtility(this.sequencer, this.thread);
            // 将生成器函数转换成生成器
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
