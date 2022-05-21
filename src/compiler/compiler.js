/* eslint-disable no-warning-comments */
/* eslint-disable no-console */
const StringUtil = require('../util/string-util');
const VariablePool = require('./variable-pool');
const CompiledScript = require('./compiled-script');

class Compiler {
    constructor (thread) {
        this.thread = thread;
        this.runtime = thread.runtime;
        this._blocks = thread.blockContainer._blocks;
        this.varPool = new VariablePool('compiler');
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
            // eslint-disable-next-line max-len
            if (this.runtime.getIsHat(this.getBlockById(topId).opcode) || this.isBranch(this.getBlockById(topId).opcode)) {
                return new CompiledScript('script', this.generateStack(topId));
            }
            const compiledStack = [];
            const varName = this.varPool.add();
            // eslint-disable-next-line max-len
            compiledStack.push(`const reported = yield* function* () {\n${this.generateBlock(this.getBlockById(topId))}\n}()`);
            compiledStack.push(`const ${varName} = yield* waitPromise(reported);`);
            // eslint-disable-next-line max-len
            compiledStack.push(`if (${varName} !== undefined) util.runtime.visualReport("${topId}", ${varName})`);
            return new CompiledScript('script', compiledStack.join('\n'));
        }
        // @todo 通过代码的方式让线程退休，而不应由sequencer进行判断。
        // if (isTopLevel) compiledStack.push(`util.runtime.sequencer.retireThread(util.thread)`);
        return new CompiledScript('script', this.generateStack(topId));
    }

    /**
     * 生成某个代码栈的代码
     * @param {string} topId - 线程的顶部积木的 id
     * @param {boolean} isWarp - 是否不使用 yield，用于确认是否不刷新
     * @param {string[]} paramNames - 积木的参数名称列表
     * @returns {string} 生成的代码
     */
    generateStack (topId, isWarp = false, paramNames) {
        const compiledStack = [];
        // 跳过编译 HAT 和 函数定义
        // eslint-disable-next-line max-len
        if (!topId) return;
        // eslint-disable-next-line max-len
        let currentBlockId = (this.runtime.getIsHat(this.getBlockById(topId).opcode) || this.getBlockById(topId).opcode === 'procedures_definition' || this.getBlockById(topId).opcode === 'procedures_definition_return') ? this.getBlockById(topId).next : topId;
        while (currentBlockId !== null) {
            compiledStack.push(this.generateBlock(this.getBlockById(currentBlockId), isWarp, paramNames));
            currentBlockId = this.getBlockById(currentBlockId).next;
        }
        return compiledStack.join('\n');
    }

    /**
     * 生成某个积木的代码
     * @param {object} block - 积木对象
     * @param {boolean} isWarp - 是否不使用 yield，用于确认是否不刷新
     * @param {string[]} paramNames - 积木的参数名称列表
     * @returns {string} 生成的代码
     */
    generateBlock (block, isWarp = false, paramNames) {
        if (!block) throw new Error('block is undefined');
        
        try {
            // 如果为自定义积木，则开始生成自定义积木，并通过yield * 移交执行权
            // 我还没想好自定义返回值和全局怎么写，走一步看一步吧
            if (block.opcode === 'procedures_call' || block.opcode === 'procedures_call_return') {
                // 获取自定义函数信息
                // eslint-disable-next-line max-len
                const paramNamesIdsAndDefaults = this.thread.target.blocks.getProcedureParamNamesIdsAndDefaults(block.mutation.proccode);
                const [_paramNames, _paramIds, _paramDefaults] = paramNamesIdsAndDefaults;
                const procedureInfo = {
                    id: block.id,
                    isGlobal: block.mutation.global ? JSON.parse(block.mutation.global) : false,
                    isWarp: block.mutation.warp ? JSON.parse(block.mutation.warp) : false,
                    isReturn: block.mutation.return ? JSON.parse(block.mutation.return) : false,
                    paramNames: _paramNames
                };
                const defId = this.thread.target.blocks.getProcedureDefinition(block.mutation.proccode);
                const generationId = StringUtil.md5(block.mutation.proccode);

                if (defId) {
                    // 把自定义积木对应的东西在线程中的编译池内
                    this.generateProcedure(defId, generationId, procedureInfo);
                    const args = this.decodeInputs(block, false, _paramNames);
                    let fragment = block.opcode === 'procedures_call' ?
                        `yield* util.thread.compiledStack["${generationId}"].generator(util, globalState` :
                        `(yield* util.thread.compiledStack["${generationId}"].generator(util, globalState`;
                    if (Object.keys(args).length > 0) fragment += `, ${JSON.stringify(args)}`;
                    fragment += block.opcode === 'procedures_call' ? `)` : `))`;
                    return fragment;
                }
                // 无头积木直接忽视执行
                return `// headless procedures call "${block.id}", ignore it.`;
            }
            const inputs = this.decodeInputs(block, false, paramNames);
            return this.runtime.getCompiledFragmentByOpcode(block.opcode, inputs, isWarp, new VariablePool(block.opcode));
        } catch (e) {
            if (e.message.startsWith('block is not compilable')) {
                // 提供没有对编译进行优化的积木的兼容性
                if (this.runtime._primitives.hasOwnProperty(block.opcode)) {
                    // 无法确认返回的是否为 Promise, 因此将其返回的结果传入PromiseLayer内进行调度
                    const inputs = this.decodeInputs(block, true, paramNames);
                    return `yield* waitPromise(util.runtime.getOpcodeFunction("${block.opcode}")(${inputs}, util))`;
                }
                console.log(block);
                throw new Error(`cannot generate "${block.opcode}"`);
            }
            console.log(block);
            throw new Error(`failed to generate "${block.opcode}":\n ${e.message}`);
        }
    }

    /**
     * 生成自定义积木的代码，并存入线程内
     * @param {string} defId - 积木定义的 id
     * @param {string} generationId - 积木的生成 id, 每一个积木的定义必须都是唯一的
     * @param {pbject} procedureInfo - 自定义积木的信息
     */
    generateProcedure (defId, generationId, procedureInfo) {
        if (this.thread.compiledStack.hasOwnProperty(generationId)) {
            console.warn('try to generate a procedure that has been generated before');
            return;
        }
        this.thread.compiledStack[generationId] = {}; // 占个位，反正最后能够敲定
        const source = this.generateStack(defId, procedureInfo.isWarp, procedureInfo.paramNames);
        // eslint-disable-next-line max-len
        this.thread.compiledStack[generationId] = new CompiledScript('procedure', source);
    }

    /**
     * 解码积木的所有输入
     * @param {object} block - 积木对象
     * @param {boolean} isInCLayer - 是否使用兼容层
     * @param {array} paramNames - 积木的参数名称
     * @returns {string[]} 解码后的输入
     */
    decodeInputs (block, isInCLayer = false, paramNames = []) {
        if (block.opcode === 'procedures_call') {
            // 自定义积木没有参数名
            const args = [];
            const mapping = JSON.parse(block.mutation.argumentids);
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
            const unit = this.decodeInput(block, name, paramNames);
            if (isInCLayer) inputs.push(`${name}: ${unit.value}`);
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
     * @param {array} paramNames - 积木的参数名称
     * @returns {object} 解析后的输入
     */
    decodeInput (block, name, paramNames) {
        const input = block.inputs[name];
        const inputBlock = this.getBlockById(input.block);
        switch (inputBlock.opcode) {
        // 函数类型
        case 'argument_reporter_boolean':
        case 'argument_reporter_string_number': {
            const index = paramNames.lastIndexOf(inputBlock.fields.VALUE.value);
            return {
                name: input.name,
                value: `(parameter['${index}'] || 0)`
            };
        }
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
                value: `"${inputBlock.fields.TEXT.value}"`
            };
        }
        // 菜单
        case 'sound_sounds_menu': {
            return {
                name: input.name,
                value: `"${inputBlock.fields.SOUND_MENU.value}"`
            };
        }
        case 'event_broadcast_menu': {
            const broadcastOption = inputBlock.fields.BROADCAST_OPTION;
            const broadcastVariable = this.thread.target.lookupBroadcastMsg(broadcastOption.id, broadcastOption.value);
            return {
                name: input.name,
                value: broadcastVariable ? `"${broadcastVariable.name}"` : ''
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

            try {
                return {
                    name: input.name,
                    value: `(${this.generateBlock(inputBlock)})`
                };
            } catch (e) {
                // 也许是菜单
                const inputs = Object.keys(inputBlock.inputs);
                const fields = Object.keys(inputBlock.fields);
                if (inputs.length === 0 && fields.length === 1) {
                    return {
                        name: input.name,
                        value: `"${inputBlock.fields[fields[0]].value}"`
                    };
                }
                throw new Error(`cannot generate input ${input.name}:\n ${e.message}`);
            }
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
