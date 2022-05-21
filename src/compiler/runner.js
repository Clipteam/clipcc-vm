const BlockUtility = require('../engine/block-utility');

class Runner {
    constructor (sequencer, thread) {
        this.sequencer = sequencer;
        this.thread = thread;
        this.topBlockId = thread.topBlock;
        this.globalState = {
            Timer: require('../util/timer')
        };
    }

    run () {
        // 如果生成器函数还没有变成生成器
        if (this.thread.currentGenerator === null) {
            // 创建运行必须的 BlockUtility 对象
            const blockUtility = new BlockUtility(this.sequencer, this.thread);
            // 将生成器函数转换成生成器
            this.thread.currentGenerator = this.thread.compiledStack[this.topBlockId].generator(blockUtility, this.globalState);
        }
        if (!this.thread.blockContainer.forceNoGlow) {
            this.thread.blockGlowInFrame = this.thread.topBlock;
            this.thread.requestScriptGlowInFrame = true;
        }
        return this.thread.currentGenerator.next();
    }
}

module.exports = Runner;
