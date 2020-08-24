// extension-api.js
const ScratchBlocksConstants = require('../engine/scratch-blocks-constants');
const xmlEscape = require('../util/xml-escape');

const blockType = [
    '', // ERROR
    'command',
    'reporter',
    'Boolean',
    '', // BRANCH
    'hat'
];

class ExtensionAPI {
    constructor (vm) {
        this.vm = vm;
    }

    _getCategory(categoryId) {
        for (const category of this.vm.runtime._blockInfo) {
            if (category.id === categoryId) {
                return category;
            }
        }
        // TODO: Error throw
    }

    _generateBlockInfo(block) {
        return {
            opcode: block.opcode,
            func: block.func,
            blockType: blockType[block.type],
            text: block.msgid
        };
    }

    addBlock (block) {
        this._getCategory(block.categoryId, category => {
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
                category,
                blockInfo,
                inputList: []
            };

            // TODO: Show icon before block

            switch (blockInfo.blockType) {
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
        });
        console.log('Add a new block', block);
    }

    removeBlock (blockId) {
        console.log('Remove a block', blockId);
    }

    addCategory (category) {
        const categoryInfo = {
            id: category.categoryId,
            name: category.msgid,
            color1: category.color || '#0FBD8C',
            blocks: [],
            customFieldTypes: {},
            menus: [],
            menuInfo: {}
        };

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
