/* eslint-disable no-console */
class Compiler {
    constructor (thread) {
        this.thread = thread;
        this.runtime = thread.runtime;
        this._blocks = thread.blockContainer._blocks;
        this._uniVarId = 0;
        console.log('blocks:', this._blocks);
    }

    get uniVar () {
        return `var_${this._uniVarId}`;
    }

    generateStack (topId, isTopLevel = false) {
        console.log(`topId: ${topId}`); // debug
        
        const compiledStack = [];
        // 检测是否为直接点击运行，并反馈给 visualReport
        if (this.thread.stackClick) {
            this._uniVarId++;
            compiledStack.push(`const ${this.uniVar} = ${this.generateBlock(this.getBlockById(topId))};`);
            compiledStack.push(`if (${this.uniVar} !== undefined) util.runtime.visualReport("${topId}", ${this.uniVar})`);
        } else {
            // 跳过编译 HAT
            // eslint-disable-next-line max-len
            let currentBlockId = this.runtime.getIsHat(this.getBlockById(topId).opcode) ? this.getBlockById(topId).next : topId;
            while (currentBlockId !== null) {
                console.log(`current block id is ${currentBlockId}`); // debug
                compiledStack.push(this.generateBlock(this.getBlockById(currentBlockId)));
                currentBlockId = this.getBlockById(currentBlockId).next;
            }
        }
        // @todo 通过代码的方式让线程退休，而不应由sequencer进行判断。
        if (isTopLevel) compiledStack.push(`util.runtime.sequencer.retireThread(util.thread)`);
        return compiledStack.join('\n');
    }

    generateBlock (block) {
        if (!block) return '// null block';
        
        try {
            return this.runtime.getCompiledFragmentByOpcode(block.opcode, this.decodeInputs(block));
        } catch (e) {
            // 提供没有对编译进行优化的积木的兼容性
            if (this.runtime._primitives.hasOwnProperty(block.opcode)) {
                return `util.runtime.getOpcodeFunction("${block.opcode}")(${this.decodeInputs(block, true)}, util)`;
            }
            return `// cannot generate "${block.opcode}"`;
        }
    }

    decodeInputs (block, isInCLayer = false) {
        const inputs = isInCLayer ? [] : {};
        for (const name in block.inputs) {
            const input = block.inputs[name];
            const inputBlock = this.getBlockById(input.block);
            switch (inputBlock.opcode) {
            case 'colour_picker': {
                if (isInCLayer) inputs.push(`${name}: "${inputBlock.fields.COLOR.value}"`);
                else inputs.name = `"${inputBlock.fields.COLOR.value}"`;
                break;
            }
            case 'math_angle':
            case 'math_integer':
            case 'math_number':
            case 'math_positive_number':
            case 'math_whole_number': {
                const value = inputBlock.fields.NUM.value;
                if (isInCLayer) inputs.push(`${name}: (${value ? value : 0})`);
                else inputs[name] = `(${value ? value : 0})`;
                break;
            }
            case 'text': {
                if (isInCLayer) inputs.push(`${name}: "${inputBlock.fields.TEXT.value}"`);
                else inputs.name = `"${inputBlock.fields.TEXT.value}"`;
                break;
            }
            default: {
                // 非常量类型，换用generateBlock进行生成。
                if (this.isBranch(block.opcode)) {
                    // Branch 就不需要考虑兼容层了吧
                    inputs[name] = this.generateStack(inputBlock.id);
                } else if (isInCLayer) inputs.push(`${name}: ${this.generateBlock(inputBlock)}`);
                else inputs[name] = this.generateBlock(inputBlock);
            }
            }
        }
        if (isInCLayer) return `{${inputs.join(', ')}}`;
        return inputs;
    }
    
    getBlockById (id) {
        const block = this._blocks[id];
        if (!block) return this.runtime.flyoutBlocks._blocks[id];
        return block;
    }

    isBranch (opcode) {
        if (opcode === 'control_repeat') return true;
        if (opcode === 'control_repeat_until') return true;
        if (opcode === 'control_while') return true;
        if (opcode === 'control_for_each') return true;
        if (opcode === 'control_forever') return true;
        if (opcode === 'control_if') return true;
        if (opcode === 'control_if_else') return true;
        if (opcode === 'control_all_at_once') return true;
        return false;
    }
}

module.exports = Compiler;
