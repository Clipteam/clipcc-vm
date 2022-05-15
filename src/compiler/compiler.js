/* eslint-disable no-warning-comments */
/* eslint-disable no-console */
const StringUtil = require('../util/string-util');
const CompiledScript = require('./compiled-script');

class Compiler {
    constructor (thread) {
        this.thread = thread;
        this.runtime = thread.runtime;
        this._blocks = thread.blockContainer._blocks;
        this._uniVarId = 0;
    }

    /**
     * @returns {string[]} the unique variable name.
     */
    get uniVar () {
        return `var_${this._uniVarId}`;
    }

    /**
     * 为某个线程生成代码
     * @param {string} topId - 线程的顶部积木的 id
     * @param {boolean} isWarp - 是否不使用 yield，用于确认是否不刷新
     * @returns {string} 生成的代码
     */
    generate (topId) {
        // 检测是否为直接点击运行，并反馈给 visualReport
        if (this.thread.stackClick) {
            const compiledStack = [];
            this._uniVarId++;
            compiledStack.push(`let ${this.uniVar} = ${this.generateBlock(this.getBlockById(topId))};`);
            // 如果积木返回为 Promise 的话，等待 Promise 完成 再进行 visualReport 判断
            compiledStack.push(`if (${this.uniVar} instanceof Promise) {`);
            compiledStack.push(`${this.uniVar}.then((value) => {`);
            compiledStack.push(`${this.uniVar} = value`);
            // eslint-disable-next-line max-len
            compiledStack.push(`if (${this.uniVar} !== undefined) util.runtime.visualReport("${topId}", ${this.uniVar})`);
            compiledStack.push(`}).catch((err) => {})`);
            // eslint-disable-next-line max-len
            compiledStack.push(`} else if (${this.uniVar} !== undefined) util.runtime.visualReport("${topId}", ${this.uniVar})`);
            return compiledStack.join('\n');
        }
        // @todo 通过代码的方式让线程退休，而不应由sequencer进行判断。
        // if (isTopLevel) compiledStack.push(`util.runtime.sequencer.retireThread(util.thread)`);
        return new CompiledScript('script', this.generateStack(topId));
    }

    /**
     * 生成某个代码栈的代码
     * @param {string} topId - 线程的顶部积木的 id
     * @param {boolean} isWarp - 是否不使用 yield，用于确认是否不刷新
     * @returns {string} 生成的代码
     */
    generateStack (topId, isWarp = false) {
        const compiledStack = [];
        // 跳过编译 HAT 和 函数定义
        // eslint-disable-next-line max-len
        let currentBlockId = (this.runtime.getIsHat(this.getBlockById(topId).opcode) || this.getBlockById(topId).opcode === 'procedures_definition') ? this.getBlockById(topId).next : topId;
        while (currentBlockId !== null) {
            compiledStack.push(this.generateBlock(this.getBlockById(currentBlockId), isWarp));
            currentBlockId = this.getBlockById(currentBlockId).next;
        }
        return compiledStack.join('\n');
    }

    /**
     * 生成某个积木的代码
     * @param {object} block - 积木对象
     * @param {boolean} isWarp - 是否不使用 yield，用于确认是否不刷新
     * @returns {string} 生成的代码
     */
    generateBlock (block, isWarp = false) {
        if (!block) throw new Error('block is undefined');
        console.log(block);
        
        try {
            // 如果为自定义积木，则开始生成自定义积木，并通过yield * 移交执行权
            // 我还没想好自定义返回值和全局怎么写，走一步看一步吧
            if (block.opcode === 'procedures_call') {
                const defId = this.thread.target.blocks.getProcedureDefinition(block.mutation.proccode);
                const generationId = StringUtil.md5(block.mutation.proccode);
                if (defId) {
                    this.generateProcedure(block, defId, generationId);
                    let fragment = `yield* util.thread.compiledStack["${generationId}"].generator(util,`;
                    const args = this.decodeInputs(block);
                    console.log(args);
                    for (const arg of args) {
                        fragment += `${arg}`;
                        if (arg !== args[args.length - 1]) fragment += ',';
                    }
                    fragment += `)`;
                    return fragment;
                }
                // 无头积木直接忽视执行
                return `// headless procedures call "${block.id}", ignore it.`;
            }
            return this.runtime.getCompiledFragmentByOpcode(block.opcode, this.decodeInputs(block), isWarp);
        } catch (e) {
            if (e.message.startsWith('block is not compilable')) {
                // 提供没有对编译进行优化的积木的兼容性
                if (this.runtime._primitives.hasOwnProperty(block.opcode)) {
                    return `util.runtime.getOpcodeFunction("${block.opcode}")(${this.decodeInputs(block, true)}, util)`;
                }
                throw new Error(`cannot generate "${block.opcode}"`);
            }
            throw new Error(`failed to generate "${block.opcode}":\n ${e.message}`);
        }
    }

    /**
     * 生成自定义积木的代码，并存入线程内
     * @param {object} block - 积木对象
     * @param {string} defId - 积木定义的 id
     * @param {string} generationId - 积木的生成 id, 每一个积木的定义必须都是唯一的
     */
    generateProcedure (block, defId, generationId) {
        if (this.thread.procedures.hasOwnProperty(generationId)) {
            console.warn('try to generate a procedure that has been generated before');
            return;
        }
        this.thread.procedures[generationId] = {}; // 占个位，反正最后能够敲定
        const procedureInfo = {
            id: block.id,
            isGlobal: JSON.parse(block.mutation.global),
            isWarp: JSON.parse(block.mutation.warp),
            isReturn: JSON.parse(block.mutation.return)
        };
        const source = this.generateStack(defId, procedureInfo.isWarp);
        // eslint-disable-next-line max-len
        this.thread.compiledStack[generationId] = new CompiledScript('procedure', source, JSON.parse(block.mutation.argumentids));
    }

    /**
     * 解码积木的所有输入
     * @param {object} block - 积木对象
     * @param {boolean} isInCLayer - 是否使用兼容层
     * @returns {string[]} 解码后的输入
     */
    decodeInputs (block, isInCLayer = false) {
        if (block.opcode === 'procedures_call') {
            // 自定义积木没有参数名，因此使用数组
            const args = [];
            const mapping = JSON.parse(block.mutation.argumentids);
            console.log('mapping', mapping);
            for (const item of mapping) {
                const input = block.inputs[item];
                if (input.block === input.shadow) { // 非嵌套reporter模块，开始获取值
                    args.push(this.decodeConstant(this.getBlockById(input.block)));
                } else {
                    const inputBlock = this.thread.target.blocks.getBlock(input.block);
                    args.push(this.generateBlock(inputBlock));
                }
            }
            return args;
        }
        const inputs = isInCLayer ? [] : {};
        // 解析可输入内容
        for (const name in block.inputs) {
            const unit = this.decodeInput(block, name);
            if (isInCLayer) inputs.push(`${name}: "${unit.value}"`);
            else inputs[name] = unit.value;
        }
        // 解析常量类型输入
        for (const name in block.fields) {
            // 没想好兼容输出咋做，暂时搁置
            inputs[name] = block.fields[name];
        }
        if (isInCLayer) return `{${inputs.join(', ')}}`;
        return inputs;
    }

    /**
     * 解析单个输入
     * @param {object} block - 积木对象
     * @param {string} name - 输入名称
     * @returns {object} 解析后的输入
     */
    decodeInput (block, name) {
        const input = block.inputs[name];
        const inputBlock = this.getBlockById(input.block);
        switch (inputBlock.opcode) {
        // 基本类型
        case 'colour_picker': {
            return {
                name: input.name,
                value: inputBlock.fields.COLOR.value
            };
        }
        case 'math_angle':
        case 'math_integer':
        case 'math_number':
        case 'math_positive_number':
        case 'math_whole_number': {
            const value = inputBlock.fields.NUM.value;
            return {
                name: input.name,
                value: value ? value : 0
            };
        }
        case 'text': {
            return {
                name: input.name,
                value: inputBlock.fields.TEXT.value
            };
        }
        // 菜单
        case 'sound_sounds_menu': {
            return {
                name: input.name,
                value: inputBlock.fields.SOUND_MENU.value
            };
        }
        case 'event_broadcast_menu': {
            const broadcastOption = inputBlock.fields.BROADCAST_OPTION;
            const broadcastVariable = this.thread.target.lookupBroadcastMsg(broadcastOption.id, broadcastOption.value);
            return {
                name: input.name,
                value: broadcastVariable ? broadcastVariable.name : ''
            };
        }
        default: {
            // 非常量类型，换用 generateBlock 进行生成。
            if (this.isBranch(block.opcode)) {
                // Branch 就不需要考虑兼容层了吧
                return {
                    name: input.name,
                    value: this.generateStack(inputBlock.id)
                };
            }
            return {
                name: input.name,
                value: this.generateBlock(inputBlock)
            };
        }
        }
    }

    /**
     * 解析常量输入，仅用在解析自定义积木的常量输入内
     * @param {object} inputBlock - 输入积木对象
     * @returns {string} 解析后的常量值
     * @private
     * @todo 迁移到 decodeInput 内
     */
    decodeConstant (inputBlock) {
        switch (inputBlock.opcode) {
        case 'math_number':
        case 'math_integer':
        case 'math_positive_number':
        case 'math_whole_number': {
            return inputBlock.fields.NUM.value;
        }
        case 'text': {
            return inputBlock.fields.TEXT.value;
        }
        case 'colour_picker': {
            return inputBlock.fields.COLOR.value;
        }
        case 'sound_sounds_menu': {
            return inputBlock.fields.SOUND_MENU.value;
        }
        case 'event_broadcast_menu': {
            const broadcastOption = inputBlock.fields.BROADCAST_OPTION;
            const broadcastVariable = this.thread.target.lookupBroadcastMsg(broadcastOption.id, broadcastOption.value);
            return broadcastVariable ? broadcastVariable.name : '';
        }
        default: {
            return '';
        }
        }
    }
    
    /**
     * 在积木容器内获取对应的积木
     * @param {string} id - 积木id
     * @returns {object} 积木对象
     */
    getBlockById (id) {
        const block = this._blocks[id];
        if (!block) return this.runtime.flyoutBlocks._blocks[id]; // 也许积木存在 flyout 里
        return block;
    }

    /**
     * 判断积木是否是 BRANCH 类型积木
     * @param {string} opcode - 积木类型
     * @returns {boolean} 是否是 BRANCH 类型
     */
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
