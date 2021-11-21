/**
 * 用于生成线程执行需要的JIT函数。
 */
const GenerateFunction = Object.getPrototypeOf(function*(){}).constructor;

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
    motion_goto_menu: 'TO'
};

class Generator {
    constructor (thread) {
        this.thread = thread;
        this.blocksCode = {};
        this.prefixFlag = {};
        this.script = 'const {util, MathUtil, Cast, blockClass, ioQuery} = CompilerUtil;\n';
        
        // 写入所有可编译的代码
        for (const id in generateMapping) {
            const compilerCategory = generateMapping[id];
            Object.assign(this.blocksCode, compilerCategory.getCode());
        }
        
        console.log("生成表：", this.blocksCode);
    }
    
    generate () {
        console.log(this.thread);
        const target = this.thread.target;
        if (!target) throw new Error('target is undefined');

        let topBlockId = this.thread.topBlock;
        const topBlock = this.thread.target.blocks.getBlock(topBlockId);
        if (this.thread.blockContainer.runtime.getIsHat(topBlock.opcode)) {
            // hat block should not be compiled
            topBlockId = topBlock.next;
        }
        if (topBlock.parent === null && topBlock.next === null) throw new Error('unnecessary to generate single block');
        this.script += this.generateStack(topBlockId/* topBlock.next*/);
        this.thread.jitFunc = new GenerateFunction('CompilerUtil', this.script);// 使用构建函数来处理流程
        this.thread.isActivated = false;
        // debug
        console.log('生成代码：\n', this.script);
    }
    
    generateStack (beginId) {
        let stackScript = '';
        let currentId = beginId;
        const blocks = this.thread.target.blocks._blocks;
        
        while (currentId !== null) {
            const block = this.thread.target.blocks.getBlock(currentId);
            if (!block) throw new Error('block is undefined');
            const fragment = this.generateBlock(block, blocks);
            if (fragment != 'opcode is undefined') {
                stackScript += fragment;
                currentId = block.next;
            } else {
                throw new Error('opcode is undefined');
            }
        }
        return stackScript;
    }
    
    generateBlock (block, blocks) {
        for (const opcode in this.blocksCode) {
            if (opcode == block.opcode) {
                const fragment = `${this.blocksCode[opcode]}\n`;
                return this.deserializeParameters(fragment, blocks, block);
            }
        }
        return 'opcode is undefined';
    }
    
    deserializeParameters (frag, blocks, block) {
        let fragment = frag;
        for (const inputId in block.inputs) { // 逐个替换Inputs
            let value;
            const input = block.inputs[inputId]; // 获取该input的值
            if (input.block == input.shadow) { // 非嵌套reporter模块，开始获取值
                const targetBlock = blocks[input.block]; // 指向的模块
                if (targetBlock.opcode) {
                    const fieldId = fieldMap[targetBlock.opcode];
                    value = targetBlock.fields[fieldId].value;
                } else {
                    console.error(`Unknown field type:${targetBlock.opcode}`);
                }
            } else if (inputId == 'SUBSTACK' || inputId == 'SUBSTACK2') {
                if (!input.block) value = '';
                else value = this.generateStack(input.block);
            } else {
                value = this.generateBlock(this.thread.target.blocks.getBlock(input.block), blocks);
            }
            const reg = new RegExp(`#<${inputId}>#`, 'g');
            fragment = fragment.replace(reg, value);
        }
        
        for (const fieldId in block.fields) { // 逐个替换fields
            const field = block.fields[fieldId]; // 获取该field的值
            const reg = new RegExp(`#<${field.name}>#`, 'g');
            fragment = fragment.replace(reg, field.value);
        }
        return fragment;
    }
}

module.exports = Generator;
