/* eslint-disable no-console */
class Compiler {
    constructor (runtime, blocks) {
        this.runtime = runtime;
        this._blocks = blocks;
        console.log('blocks:', blocks);
    }
    generateStack (topId) {
        console.log(topId); // debug
        const compiledStack = [];
        // 跳过编译 HAT
        let currentBlockId = this.runtime.getIsHat(this.getBlockById(topId).opcode) ? this.getBlockById(topId).next : topId;
        while (currentBlockId !== null) {
            compiledStack.push(this.generateBlock(this.getBlockById(currentBlockId)));
            currentBlockId = this.getBlockById(currentBlockId).next;
        }
        return compiledStack.join('\n');
    }

    generateBlock (block) {
        if (!block) return '// null block';
        // 提供没有对编译进行优化的积木的兼容性
        if (this.runtime._primitives.hasOwnProperty(block.opcode)) {
            return `util.runtime.getOpcodeFunction("${block.opcode}")(${this.decodeInputs(block)}, util);`;
        }
        return `// cannot generate "${block.opcode}"`;
    }

    decodeInputs (block) {
        const inputs = [];
        for (const name in block.inputs) {
            const input = block.inputs[name];
            const inputBlock = this.getBlockById(input.block);
            switch (inputBlock.opcode) {
            case 'math_number': {
                const value = inputBlock.fields.NUM.value;
                inputs.push(`${name}: (${value ? value : 0})`);
                break;
            }
            case 'text': {
                inputs.push(`${name}: "${inputBlock.fields.TEXT.value}"`);
                break;
            }
            }
        }
        return `{${inputs.join(', ')}}`;
    }
    
    getBlockById (id) {
        const block = this._blocks[id];
        if (!block) return this.runtime.flyoutBlocks._blocks[id];
        return block;
    }
}

module.exports = Compiler;
