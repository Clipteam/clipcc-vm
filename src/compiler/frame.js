class Frame {
    constructor (isLoop) {
        /**
         * 该 Frame 是否处于循环体内
         * @type {boolean}
         */
        this.isLoop = isLoop;

        /**
         * 该积木是否为该 Frame 的最后一个积木
         * @type {boolean}
         */
        this.isLastBlock = false;
    }
}

module.exports = Frame;
