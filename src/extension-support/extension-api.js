// extension-api.js
const ScratchBlocksConstants = require('./scratch-blocks-constants');

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

    _getCategory(categoryId, callback) {
        for (let category of this.vm.runtime._blockInfo) {
            if (category.id === categoryId) {
                callback(category);
                break;
            }
        }
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
        this._getCategory(block.categoryId, (category) => {
            const blockJSON = {
                type: block.opcode,
                inputsInline: true,
                category: category.name,
                colour: category.color1,
                colourSecondary: category.color2,
                colourTertiary: category.color3
            };
            const context = {
                argsMap: {},
                blockJSON,
                category,
                _generateBlockInfo(block),
                inputList: []
            };

            // TODO: ICON URI

            switch (blockInfo.blockType) {
            case 1: // COMMAND
                blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE;
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
