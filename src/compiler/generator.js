/**
 * 用于生成线程执行需要的JIT函数。
 */
const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;

const generateMapping = [
    require('./blocks/motion.js'),
    require('./blocks/looks.js'),
    require('./blocks/control.js'),
    require('./blocks/sensing.js'),
    require('./blocks/sound.js'),
    require('./blocks/operators.js'),
    require('./blocks/pen.js')
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
        const prefix = 'const {util, MathUtil, blockClass, Cast, ioQuery} = CompilerUtil;\n';
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
                console.log('由' + currentBlockId + '开始的生成代码：\n', generatedObj.script); // DEBUG
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
        
        console.log(this.thread.compiledFragment);
    }
    
    generateStack (beginId) {
        let stackScript = '';
        let currentId = beginId;
        
        while (currentId !== null) {
            const block = this.thread.target.blocks.getBlock(currentId);
            if (!block) throw new Error('block is undefined');
            const fragment = this.generateBlock(block);
            if (fragment != 'opcode is undefined') {
                stackScript += fragment + '\n';
                currentId = block.next;
            } else {
                console.log('opcode为' + block.opcode + '的积木不存在，结束本段编译...');
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
        if (!this.blocksProcessor[block.opcode]) return `opcode is undefined`;
        try {
            const parameters = this.deserializeParameters(block);
            // 防止树状语句造成的漏执行问题
            if (parameters.SUBSTACK == '' || parameters.SUBSTACK2 == '') return `opcode is undefined`;
            //console.log(parameters, this.thread.target.isStage);
            return this.blocksProcessor[block.opcode](parameters, this.thread.target.isStage);
        } catch (e) {
            throw new Error(`An error occurred while generating block:\n ${e}`);
        }
    }
    
    deserializeParameters (block) {
        const parameters = {};
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
