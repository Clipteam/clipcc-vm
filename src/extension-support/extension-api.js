// extension-api.js
const ScratchBlocksConstants = require('../engine/scratch-blocks-constants');
const xmlEscape = require('../util/xml-escape');
const maybeFormatMessage = require('../util/maybe-format-message');
const formatMessage = require('format-message');

const blockType = [
    '', // ERROR
    'command',
    'reporter',
    'Boolean',
    '', // BRANCH
    'hat'
];

const argumentType = [
    '', // ERROR
    'number',
    'string',
    'Boolean',
    'color'
];

class ExtensionAPI {
    constructor (vm) {
        this.vm = vm;
        this.categorys = [];
        this.blocks = [];
    }

    _getCategory (categoryId) {
        for (const category of this.vm.runtime._blockInfo) {
            if (category.id === categoryId) {
                return category;
            }
        }
        // TODO: Error throw
    }

    _generateBlockInfo (block) {
        const argumentsInfo = {};
        for (const name in block.argument) {
            argumentsInfo[name] = {
                type: argumentType[block.argument[name].type],
                defaultValue: block.argument[name].default
            };
        }
        return {
            opcode: block.opcode,
            func: block.function,
            blockType: blockType[block.type],
            messageId: block.messageId,
            text: formatMessage({
                id: block.messageId,
                default: block.messageId
            }),
            arguments: argumentsInfo
        };
    }

    refreshBlocks () {
        return new Promise(() => {
            for (const i in this.categorys) {
                this.categorys[i].name = formatMessage({
                    id: this.categorys[i].messageId,
                    default: this.categorys[i].messageId
                });
                for (const j in this.categorys[i].blocks) {
                    this.categorys[i].blocks[j].text = formatMessage({
                        id: this.categorys[i].blocks[j].messageId,
                        default: this.categorys[i].blocks[j].messageId
                    });
                }
                this.vm.runtime.emit('BLOCKSINFO_UPDATE', this.categorys[i]);
            }
        });
    }

    addBlock (block) {
        const category = this._getCategory(block.categoryId);
        const blockJSON = {
            type: block.opcode,
            inputsInline: true,
            category: category.name,
            colour: category.color1,
            colourSecondary: category.color2,
            colourTertiary: category.color3
        };
        const blockInfo = this._generateBlockInfo(block);
        const context = {
            argsMap: {},
            blockJSON,
            categoryInfo: category,
            blockInfo,
            inputList: []
        };

        // TODO: Show icon before block

        switch (block.type) {
        case 1: // COMMAND
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE;
            blockJSON.previousStatement = null;
            blockJSON.nextStatement = null;
            // TODO: before and next connection
            // engine/runtime.js: Line 1104-1107
            break;
        case 2: // REPORTER
            blockJSON.output = 'String';
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_ROUND;
            break;
        case 3: // BOOLEAN
            blockJSON.output = 'Boolean';
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_HEXAGONAL;
            break;
        case 4: // BRANCH
            // TODO: Block with branch
            break;
        case 5: // HAT
            // TODO: Hat
            break;
        default:
            // TODO: Error, unknown
            break;
        }
        // TODO: Alternate between a block "arm" with text on it and an open slot for a substack
        // engine/runtime.js: line 1145-1167
        const blockText = Array.isArray(blockInfo.text) ? blockInfo.text : [blockInfo.text];
        const convertPlaceholders = this.vm.runtime._convertPlaceholders.bind(this.vm.runtime, context);
        let inTextNum = 0;
        let inBranchNum = 0;
        let outLineNum = 0;
        console.log(context);
        while (inTextNum < blockText.length || inBranchNum < blockInfo.branchCount) {
            if (inTextNum < blockText.length) {
                context.outLineNum = outLineNum;
                const lineText = maybeFormatMessage(blockText[inTextNum]);
                console.log(1, lineText);
                const convertedText = blockText[inTextNum].replace(/\[(.+?)]/g, convertPlaceholders);
                if (blockJSON[`message${outLineNum}`]) {
                    blockJSON[`message${outLineNum}`] += convertedText;
                } else {
                    blockJSON[`message${outLineNum}`] = convertedText;
                }
                ++inTextNum;
                ++outLineNum;
            }
            if (inBranchNum < blockInfo.branchCount) {
                blockJSON[`message${outLineNum}`] = '%1';
                blockJSON[`args${outLineNum}`] = [{
                    type: 'input_statement',
                    name: `SUBSTACK${inBranchNum > 0 ? inBranchNum + 1 : ''}`
                }];
                ++inBranchNum;
                ++outLineNum;
            }
        }

        // TODO: Monitor of reporter
        // engine/runtime.js: line 1169-1173

        // TODO: Icon of loop block
        // engine/runtime.js: line 1173-1186

        const mutation = blockInfo.isDynamic ? `<mutation blockInfo="${xmlEscape(JSON.stringify(blockInfo))}"/>` : '';
        const inputs = context.inputList.join('');
        const blockXML = `<block type="${block.opcode}">${mutation}${inputs}</block>`;

        const convertedBlock = {
            info: context.blockInfo,
            json: context.blockJSON,
            xml: blockXML
        };

        category.blocks.push(convertedBlock);
        if (convertedBlock.json) {
            const opcode = convertedBlock.json.type;
            this.vm.runtime._primitives[opcode] = convertedBlock.info.func;
            // TODO: For hat and event
            // engine/runtime.js: line 902-912
        }

        this.blocks.push(blockInfo);
        console.log('Add a new block', blockInfo, category);
        this.vm.emit('BLOCKSINFO_UPDATE', category);
        //this.vm.emit('EXTENSION_ADDED', category);
    }

    removeBlock (blockId) {
        console.log('Remove a block', blockId);
    }

    addCategory (category) {
        const categoryInfo = {
            id: category.categoryId,
            messageId: category.messageId,
            name: formatMessage({
                id: category.messageId,
                default: category.messageId
            }),
            color1: category.color || '#0FBD8C',
            blocks: [],
            customFieldTypes: {},
            menus: [],
            menuInfo: {}
        };

        this.categorys.push(categoryInfo);
        console.log('Add a category', category);
        this.vm.runtime._blockInfo.push(categoryInfo);
        this.vm.emit('EXTENSION_ADDED', categoryInfo);
    }

    removeCategory (categoryId) {
        /*
        for (let i in this.vm.runtime._blockInfo) {
            const category = this.vm.runtime._blockInfo[i];
            if (category.id === categoryId) {
                this.vm.runtime._blockInfo.splice(i, 1);
                this.vm.emit('EXTENSION_ADDED', categoryInfo);
            }
        }
        */
        conole.log('Remove a category', categoryId);
    }
}

module.exports = ExtensionAPI;
