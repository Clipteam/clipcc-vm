/**
 * 用于生成线程执行需要的JIT函数。
 */
const GenerateFunction = Object.getPrototypeOf(function*(){}).constructor;

const coreBlocks = {
    motion: require('./blocks/motion.js'),
    looks: require('./blocks/looks.js'),
    control: require('./blocks/control.js'),
    sensing: require('./blocks/sensing.js'),
    sound: require('./blocks/sound.js'),
    operator: require('./blocks/operators.js')
}

class Generator {
    constructor (thread) {
        this.thread = thread;
        this.blocksCode = {};
        this.prefixFlag = {};
        this.script = '//Generated by compiler\n';
        
        // 写入所有可编译的代码
        this.blocksCode = Object.assign(this.blocksCode, coreBlocks.motion.getCode());
        this.blocksCode = Object.assign(this.blocksCode, coreBlocks.looks.getCode());
        this.blocksCode = Object.assign(this.blocksCode, coreBlocks.control.getCode());
        this.blocksCode = Object.assign(this.blocksCode, coreBlocks.sound.getCode());
        this.blocksCode = Object.assign(this.blocksCode, coreBlocks.sensing.getCode());
        this.blocksCode = Object.assign(this.blocksCode, coreBlocks.operator.getCode());
    }
    
    generate () {
        console.log(this.thread);
        const target = this.thread.target;
        if (!target) throw new Error('target is undefined');

        let topBlockId= this.thread.topBlock;
        if (this.thread.blockContainer.runtime.getIsHat(this.thread.target.blocks.getBlock(topBlockId).opcode)) {
            // hat block should not be compiled
            topBlockId = this.thread.target.blocks.getBlock(topBlockId).next;
        }
        this.script += this.generateStack(topBlockId/*topBlock.next*/);
        this.thread.jitFunc = new GenerateFunction('util', 'MathUtil', 'Cast', this.script);//使用构建函数来处理流程
        this.thread.isActivated = false;
        //debug
        console.log('生成代码：\n', this.script);
    }
    
    generateStack (beginId) {
        let stackScript = '';
        let currentId = beginId;
        const blocks = this.thread.target.blocks._blocks;
        
        while (currentId !== null) {
            const block = this.thread.target.blocks.getBlock(currentId);
            if (!block) throw new Error('block is undefined');
            let fragment = this.generateBlock(block, blocks);
            if (fragment != 'opcode is undefined') {
                stackScript += fragment;
                currentId = block.next;
            }
            else throw new Error('opcode is undefined');
        }
        return stackScript;
    }
    
    generateBlock (block, blocks) {
        for(const opcode in this.blocksCode) {
            if (opcode == block.opcode) {
                const categoryId = opcode.split('_')[0];
                let fragment = '';
                if(!this.prefixFlag[categoryId]) {
                    // 获取执行必须的前置函数
                    fragment += coreBlocks[categoryId].getPrefix() + '\n';
                    this.prefixFlag[categoryId] = true;
                }
                fragment += this.blocksCode[opcode] + '\n';
                console.log(blocks);
                return this.deserializeInputs(fragment, blocks, block);
            }
        }
        return 'opcode is undefined';
    }
    
    deserializeInputs (frag, blocks, block) {
        let fragment = frag;
        let value;
        for (const inputId in block.inputs) { // 逐个替换Inputs
            const input = block.inputs[inputId]; // 获取该input的值
            if (input.block == input.shadow) { //非嵌套reporter模块，开始获取值
                const targetBlock = blocks[input.block]; // 指向的模块
                switch (targetBlock.opcode) {
                    case 'text': {
                        value = targetBlock.fields.TEXT.value;
                        break;
                    }
                    case 'math_number': {
                        value = targetBlock.fields.NUM.value;
                        break;
                    }
                    case 'math_positive_number': {
                        value = targetBlock.fields.NUM.value;
                        break;
                    }
                    case 'math_whole_number': {
                        value = targetBlock.fields.NUM.value;
                        break;
                    }
                    case 'colour_picker': {
                        value = targetBlock.fields.COLOUR.value;
                        break;
                    }
                    case 'data_variable': {
                        value = targetBlock.fields.VARIABLE.value;
                        break;
                    }
                    case 'event_broadcast_menu': {
                        value = targetBlock.fields.BROADCAST.value;
                        break;
                    }
                    case 'data_listcontents': {
                        value = targetBlock.fields.LIST.value;
                        break;
                    }
                    case 'math_integer': {
                        value = targetBlock.fields.NUM.value;
                        break;
                    }
                    case 'math_angle': {
                        value = targetBlock.fields.NUM.value;
                        break;
                    }
                    default: {
                        console.error('Unknown field type:' + targetBlock.opcode);
                    }
                }
            } else {
                if (inputId == 'SUBSTACK' || inputId == 'SUBSTACK2') {
                    if (!input.block) value = '';
                    else value = this.generateStack(input.block);
                } else {
                    value = this.generateBlock(this.thread.target.blocks.getBlock(input.block), blocks);
                }
            }
            const reg = new RegExp('#<' + inputId + '>#', 'g');
            fragment = fragment.replace(reg, value);
        }
        return fragment;
    }
}

module.exports = Generator;