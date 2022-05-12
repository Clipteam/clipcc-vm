/* eslint-disable no-console */
const StringUtil = require('../util/string-util');

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
            compiledStack.push(`let ${this.uniVar} = ${this.generateBlock(this.getBlockById(topId))};`);
            // 如果积木返回为 Promise 的话，等待 Promise 完成 再进行 visualReport 判断
            compiledStack.push(`if (${this.uniVar} instanceof Promise) {`);
            compiledStack.push(`${this.uniVar}.then((value) => {`);
            compiledStack.push(`${this.uniVar} = value`);
            // eslint-disable-next-line max-len
            compiledStack.push(`if (${this.uniVar} !== undefined) util.runtime.visualReport("${topId}", ${this.uniVar})`);
            compiledStack.push(`}).catch((err) => {})`);
            compiledStack.push(`} else if (${this.uniVar} !== undefined) util.runtime.visualReport("${topId}", ${this.uniVar})`);
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
        if (!block) throw new Error('block is undefined');
        
        try {
            return this.runtime.getCompiledFragmentByOpcode(block.opcode, this.decodeInputs(block));
        } catch (e) {
            // 提供没有对编译进行优化的积木的兼容性
            if (this.runtime._primitives.hasOwnProperty(block.opcode)) {
                return `util.runtime.getOpcodeFunction("${block.opcode}")(${this.decodeInputs(block, true)}, util)`;
            }
            throw new Error(`cannot generate "${block.opcode}"`);
        }
    }

    decodeInputs (block, isInCLayer = false) {
        const inputs = isInCLayer ? [] : {};
        for (const name in block.inputs) {
            const input = block.inputs[name];
            const inputBlock = this.getBlockById(input.block);
            switch (inputBlock.opcode) {
            // 基本类型
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
            // 菜单
            case 'sound_sounds_menu': {
                if (isInCLayer) inputs.push(`${name}: "${inputBlock.fields.SOUND_MENU.value}"`);
                else inputs.name = `"${inputBlock.fields.SOUND_MENU.value}"`;
                break;
            }
            case 'event_broadcast_menu': {
                const broadcastOption = inputBlock.fields.BROADCAST_OPTION;
                const broadcastVariable = this.thread.target.lookupBroadcastMsg(broadcastOption.id, broadcastOption.value);
                if (isInCLayer) inputs.push(`${name}: "${broadcastVariable ? broadcastVariable.name : ''}"`);
                else inputs.name = `"${broadcastVariable ? broadcastVariable.name : ''}"`;
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

    getBlockInfo (fullOpcode) {
        const [category, opcode] = StringUtil.splitFirst(fullOpcode, '_');
        if (!category || !opcode) {
            return null;
        }
        const categoryInfo = this.runtime._blockInfo.find(ci => ci.id === category);
        if (!categoryInfo) {
            return null;
        }
        const blockInfo = categoryInfo.blocks.find(b => b.info.opcode === opcode);
        if (!blockInfo) {
            return null;
        }
        return blockInfo;
    }
}

module.exports = Compiler;
