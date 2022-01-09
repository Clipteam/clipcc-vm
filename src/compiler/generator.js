/**
 * 用于生成线程执行需要的JIT函数。
 */
const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;
const prefix = 'const {util, MathUtil, blockClass, Cast, ioQuery} = CompilerUtil;\n';

const generateMapping = [
    require('./blocks/motion.js'),
    require('./blocks/looks.js'),
    require('./blocks/control.js'),
    require('./blocks/sensing.js'),
    require('./blocks/sound.js'),
    require('./blocks/operators.js'),
    require('./blocks/pen.js'),
    require('./blocks/procedure.js')
];

const fieldMap = {
    text: 'TEXT',
    math_number: 'NUM',
    math_positive_number: 'NUM',
    math_whole_number: 'NUM',
    math_integer: 'NUM',
    math_angle: 'NUM',
    colour_picker: 'COLOUR',
    data_variable: 'VARIABLE',
    event_broadcast_menu: 'BROADCAST',
    data_listcontents: 'LIST',
    motion_goto_menu: 'TO',
    motion_pointtowards_menu: 'TOWARDS',
    pen_menu_colorParam: 'colorParam',
    music_menu_INSTRUMENT: 'INSTRUMENT',
    music_menu_DRUM: 'DRUM'
};

class Generator {
    constructor (thread) {
        this.thread = thread;
        this.blocksProcessor = {};
        this.prefixFlag = {};
        
        // 写入所有可编译的代码
        for (const id in generateMapping) {
            const compilerCategory = generateMapping[id];
            Object.assign(this.blocksProcessor, compilerCategory.getProcessor());
        }
        
        console.log('Block Processors：', this.blocksProcessor);
    }
    
    generate () {
        console.log(this.thread);
        const target = this.thread.target;
        if (!target) throw new Error('target is undefined');

        let currentBlockId = this.thread.topBlock;
        const topBlock = this.thread.target.blocks.getBlock(currentBlockId);
        if (this.thread.blockContainer.runtime.getIsHat(topBlock.opcode)) {
            // hat block should not be compiled
            currentBlockId = topBlock.next;
        }
        // 如果是单个模块的话则跳过编译
        // 我才不会告诉你是因为我懒得写return做的
        if (topBlock.parent === null && topBlock.next === null) {
            throw new Error('unnecessary to generate single block');
        }
        
        while (currentBlockId !== null) {
            const block = this.thread.target.blocks.getBlock(currentBlockId);
            if (!!this.blocksProcessor[block.opcode]) {
                const generatedObj = this.generateStack(currentBlockId);
                console.log(currentBlockId + '开始的生成代码：\n', generatedObj.script); // DEBUG
                const generatedFunction = new GeneratorFunction('CompilerUtil', prefix + generatedObj.script);// 使用构建函数来处理流程
                this.thread.compiledFragment[currentBlockId] = {
                    func: generatedFunction,
                    nextUncompiledBlockId: generatedObj.nextUncompiledBlockId
                };
                currentBlockId = generatedObj.nextUncompiledBlockId;
            } else {
                const block = this.thread.target.blocks.getBlock(currentBlockId);
                currentBlockId = block.next;
            }
        }
        
        console.log("编译片段：", this.thread.compiledFragment);
    }
    
    generateStack (beginId) {
        let stackScript = '';
        let currentId = beginId;
        
        while (currentId !== null) {
            const block = this.thread.target.blocks.getBlock(currentId);
            if (!block) throw new Error('block is undefined');
            try {
                const fragment = this.generateBlock(block);
                stackScript += fragment + '\n';
                currentId = block.next;
            } catch (e) {
                console.log('opcode为' + block.opcode + '的积木不存在或生成错误，结束本段编译...');
                return {
                    script: stackScript,
                    nextUncompiledBlockId: currentId
                };
            }
        }
        return {
            script: stackScript,
            nextUncompiledBlockId: null // 一次性生成完了属于是
        };
    }
    
    generateBlock (block) {
        // 判断该模块是否存在
        console.log('block:', block);
        if (!this.blocksProcessor[block.opcode]) throw new Error(`opcode is undefined`);
        try {
            const parameters = this.deserializeParameters(block);
            // 防止树状语句造成的漏执行问题
            if (parameters.SUBSTACK == '' || parameters.SUBSTACK2 == '') return `opcode is undefined`;
            if (block.opcode == 'procedures_call') {
                console.log('Try to generate procedure fragment...');
                this.generateProcedure(block);
            }
            return this.blocksProcessor[block.opcode](parameters, this.thread.target.isStage);
        } catch (e) {
            throw new Error(`An error occurred while generating block:\n ${e}`);
        }
    }
    
    generateProcedure(block) {
        const defId = this.thread.target.blocks.getProcedureDefinition(block.mutation.proccode);
        const definition = block.mutation.global == 'false' ? this.thread.target.blocks.getBlock(defId) : 'null';
        const prototypeBlock = this.thread.target.blocks.getBlock(definition.inputs.custom_block.block);
        const rule = new RegExp('"', 'g');
        const param = prototypeBlock.mutation.argumentnames.replace(rule, '').slice(1, -1).split(',');
        this.thread.target.compiledProc[definition.id].param = param;
        
        let currentBlockId = definition.next;
        /*
        while (currentBlockId !== null) {
            const block = this.thread.target.blocks.getBlock(currentBlockId);
            if (!!this.blocksProcessor[block.opcode]) {
                const generatedObj = this.generateStack(currentBlockId);
                console.log(currentBlockId + '开始的生成代码：\n', generatedObj.script); // DEBUG
                const generatedFunction = new GeneratorFunction(CompilerUtil, prefix + generatedObj.script);// 使用构建函数来处理流程
                this.thread.target.compiledProc[definition.id][currentBlockId] = {
                    func: generatedFunction,
                    nextUncompiledBlockId: generatedObj.nextUncompiledBlockId
                };
                currentBlockId = generatedObj.nextUncompiledBlockId;
            } else {
                const block = this.thread.target.blocks.getBlock(currentBlockId);
                currentBlockId = block.next;
            }
        }
        */
        
        console.log(this.thread.target.compiledProc[definition.id]);
    }
    
    deserializeParameters (block) {
        // 处理自定义积木参数
        const parameters = {};
        if (block.opcode == 'procedures_call') {
            parameters.procArg = [];
            parameters.procedureInfo = {
                id: block.id,
                isGlobal: JSON.parse(block.mutation.global),
                isWarp: JSON.parse(block.mutation.warp),
                isReturn: JSON.parse(block.mutation.return)
            };
            
            const rule = new RegExp('"', 'g');
            const mapping = block.mutation.argumentids.replace(rule, '').slice(1, -1).split(',');
            console.log('mapping', mapping);
            for (const item of mapping) {
                const input = block.inputs[item];
                if (input.block == input.shadow) { // 非嵌套reporter模块，开始获取值
                    const targetBlock = this.thread.target.blocks.getBlock(input.block); // 指向的模块
                    if (targetBlock.opcode) {
                        const fieldId = fieldMap[targetBlock.opcode];
                        parameters.procArg.push(targetBlock.fields[fieldId].value);
                    } else {
                        throw new Error(`Unknown field type:${targetBlock.opcode}`);
                    }
                } else {
                    const inputBlock = this.thread.target.blocks.getBlock(input.block);
                    parameters.procArg.push(this.generateBlock(inputBlock));
                }
            }
            return parameters;
        }
        
        for (const inputId in block.inputs) {
            const input = block.inputs[inputId]; // 获取该input的值
            if (input.block == input.shadow) { // 非嵌套reporter模块，开始获取值
                const targetBlock = this.thread.target.blocks.getBlock(input.block); // 指向的模块
                if (targetBlock.opcode) {
                    const fieldId = fieldMap[targetBlock.opcode];
                    parameters[inputId] = targetBlock.fields[fieldId].value;
                } else {
                    throw new Error(`Unknown field type:${targetBlock.opcode}`);
                }
            } else if (inputId == 'SUBSTACK' || inputId == 'SUBSTACK2') {
                if (!input.block) parameters[inputId] = null;
                else parameters[inputId] = this.generateStack(input.block).script;
            } else {
                const inputBlock = this.thread.target.blocks.getBlock(input.block);
                parameters[inputId] = this.generateBlock(inputBlock);
            }
        }
        // 逐个获取fields的值
        for (const fieldId in block.fields) parameters[fieldId] = block.fields[fieldId].value;
        return parameters;
    }
}

module.exports = Generator;
