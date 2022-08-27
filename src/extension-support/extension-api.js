const ArgumentType = require('./argument-type');
const ScratchBlocksConstants = require('../engine/scratch-blocks-constants');
const xmlEscape = require('../util/xml-escape');
const maybeFormatMessage = require('../util/maybe-format-message');
const formatMessage = require('format-message');

const blockType = [
    '', // ERROR: 0
    'command', // COMMAND: 1
    'reporter', // REPORTER: 2
    'Boolean', // BOOLEAN: 3
    '', // BRANCH: 4
    'hat' // HAT: 5
];

const argumentType = [
    '', // ERROR: 0
    'number', // NUMBER: 1
    'string', // STRING: 2
    'Boolean', // BOOLEAN: 3
    'any', // ANY: 4
    'color', // COLOR: 5
    'matrix', // MATRIX: 6
    'note', // NOTE: 7
    'angle' // ANGLE: 8
];


/**
 * Information used for converting Scratch argument types into scratch-blocks data.
 * @type {object.<ArgumentType, {shadowType: string, fieldType: string}>}
 */
 const ArgumentTypeMap = (() => {
    const map = {};
    map[ArgumentType.ANGLE] = {
        shadow: {
            type: 'math_angle',
            // We specify fieldNames here so that we can pick
            // create and populate a field with the defaultValue
            // specified in the extension.
            // When the `fieldName` property is not specified,
            // the <field></field> will be left out of the XML and
            // the scratch-blocks defaults for that field will be
            // used instead (e.g. default of 0 for number fields)
            fieldName: 'NUM'
        }
    };
    map[ArgumentType.COLOR] = {
        shadow: {
            type: 'colour_picker',
            fieldName: 'COLOUR'
        }
    };
    map[ArgumentType.NUMBER] = {
        shadow: {
            type: 'math_number',
            fieldName: 'NUM'
        }
    };
    map[ArgumentType.STRING] = {
        shadow: {
            type: 'text',
            fieldName: 'TEXT'
        }
    };
    map[ArgumentType.BOOLEAN] = {
        check: 'Boolean'
    };
    map[ArgumentType.MATRIX] = {
        shadow: {
            type: 'matrix',
            fieldName: 'MATRIX'
        }
    };
    map[ArgumentType.NOTE] = {
        shadow: {
            type: 'note',
            fieldName: 'NOTE'
        }
    };
    map[ArgumentType.IMAGE] = {
        // Inline images are weird because they're not actually "arguments".
        // They are more analagous to the label on a block.
        fieldType: 'field_image'
    };
    return map;
})();

class ExtensionAPI {
    constructor (vm) {
        this.vm = vm;
        this.categoryInfo = [];
        this.blockInfo = [];
        this.blocks = new Map();
        this.categories = new Map();
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
        const paramInfo = {};
        for (const name in block.param) {
            if (block.param[name].type === 9) { // script
                continue; // skip if arg is script
            }
            paramInfo[name] = {
                type: argumentType[block.param[name].type],
                defaultValue: block.param[name].default || '',
                shadow: block.param[name].shadow
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
            arguments: paramInfo
        };
    }

    refreshBlocks () {
        return new Promise((resolve, reject) => {
            for (const i in this.categoryInfo) {
                this.categoryInfo[i].name = formatMessage({
                    id: this.categoryInfo[i].messageId,
                    default: this.categoryInfo[i].messageId
                });
                this.categoryInfo[i].menus = []
                for (const j in this.categoryInfo[i].blocks) {
                    this.categoryInfo[i].blocks[j].info.text = formatMessage({
                        id: this.categoryInfo[i].blocks[j].info.messageId,
                        default: this.categoryInfo[i].blocks[j].info.messageId
                    });
                    // Regen json info
                    const blockInfo = this.categoryInfo[i].blocks[j].info;
                    const blockJSON = this.categoryInfo[i].blocks[j].json;
                    const context = {
                        argsMap: {},
                        blockJSON,
                        categoryInfo: this.categoryInfo[i],
                        blockInfo,
                        inputList: []
                    };
                    let block = this.blocks.get(this.categoryInfo[i].blocks[j].info.opcode);
                    for (const paramId in block.param) {
                        // if the param doesn't have menu or it's an field
                        if (!block.param[paramId].menu || block.param[paramId].field) continue;
                        // if the param uses an existing menu
                        if (typeof(block.param[paramId].menu) === 'string') continue;
                        let menuItems;
                        if (typeof(block.param[paramId].menu) === 'function') {
                            menuItems = block.param[paramId].menu;
                        } else {
                            menuItems = block.param[paramId].menu.map(item => ([
                                formatMessage({
                                    id: item.messageId,
                                    default: item.messageId
                                }),
                                item.value
                            ]));
                        }
                        this.categoryInfo[i].menus.push({
                            json: {
                                message0: '%1',
                                type: block.param[paramId].menuId,
                                inputsInline: true,
                                output: 'String',
                                colour: this.categoryInfo[i].color1,
                                colourSecondary: this.categoryInfo[i].color2,
                                colourTertiary: this.categoryInfo[i].color3,
                                outputShape: ScratchBlocksConstants.OUTPUT_SHAPE_ROUND,
                                args0: [{
                                    type: 'field_dropdown',
                                    name: paramId,
                                    options: menuItems
                                }]
                            }
                        })
                    }
                    this._processBlockArguments(context, this.blocks.get(this.categoryInfo[i].blocks[j].info.opcode));
                }
                this.vm.runtime.emit('BLOCKSINFO_UPDATE', this.categoryInfo[i]);
            }
            resolve();
        });
    }

    addBlock (block) {
        const category = this._addBlock(block);
        this.vm.emit('BLOCKSINFO_UPDATE', category);
    }

    addBlocks (blocks) {
        const updateList = new Map();
        for (const block of blocks) {
            const category = this._addBlock(block);
            if (!updateList.has(category.id)) {
                updateList.set(category.id, category);
            }
        }
        for (const [_, category] of updateList) {
            this.vm.emit('BLOCKSINFO_UPDATE', category);
        }
    }

    /**
     * Helper for adding a block from prototype.
     * @param {BlockPrototype} block the block prototype to add
     * @returns {CategoryInfo} category info
     */
    _addBlock (block) {
        if (!block.option) block.option = {};
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
        if (block.option.filter) blockInfo.filter = block.option.filter; //filter过滤器
        const context = {
            argsMap: {},
            blockJSON,
            categoryInfo: category,
            blockInfo,
            inputList: []
        };

        // Process input menus
        for (const paramId in block.param) {
            // if the param doesn't have menu or it's an field
            if (!block.param[paramId].menu || block.param[paramId].field) continue;
            // if the param uses an existing menu
            if (typeof(block.param[paramId].menu) === 'string') continue;
            // check whether the menu specified an id
            if (!block.param[paramId].menuId) {
                // automatically generate an id
                block.param[paramId].menuId = `${block.opcode}.menu_${paramId}`;
            }

            //动态菜单 传function
            let menuItems;
            if (typeof(block.param[paramId].menu) === 'function') {
                menuItems = block.param[paramId].menu;
            } else {
                menuItems = block.param[paramId].menu.map(item => ([
                    formatMessage({
                        id: item.messageId,
                        default: item.messageId
                    }),
                    item.value
                ]));
            }
            
            category.menus.push({
                json: {
                    message0: '%1',
                    type: block.param[paramId].menuId,
                    inputsInline: true,
                    output: 'String',
                    colour: category.color1,
                    colourSecondary: category.color2,
                    colourTertiary: category.color3,
                    outputShape: ScratchBlocksConstants.OUTPUT_SHAPE_ROUND,
                    args0: [{
                        type: 'field_dropdown',
                        name: paramId,
                        options: menuItems
                    }]
                }
            });
        }

        // TODO: Show icon before block

        switch (block.type) {
        case 1: // COMMAND
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE;
            blockJSON.previousStatement = null;
            if (!block.option.terminal) {
                blockJSON.nextStatement = null;
            }
            break;
        case 2: // REPORTER
            blockJSON.output = 'String';
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_ROUND;
            break;
        case 3: // BOOLEAN
            blockJSON.output = 'Boolean';
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_HEXAGONAL;
            break;
        /* deleted
        case 4: // BRANCH
            // TODO: Block with branch
            break;
        */
        case 5: // HAT
            // blockInfo.isEdgeActivated = block.isEdgeActivated;
            if (!blockInfo.isEdgeActivated) {
                blockInfo.isEdgeActivated = true;
            }
            blockJSON.outputShape = ScratchBlocksConstants.OUTPUT_SHAPE_SQUARE;
            blockJSON.nextStatement = null;
            break;
        default:
        // TODO: Error, unknown
            break;
        }
        // TODO: Alternate between a block "arm" with text on it and an open slot for a substack
        // engine/runtime.js: line 1145-1167

        this._processBlockArguments(context, block);

        // Monitor of a repoter
        // add iff there is no input and hasMonitor is set
        if (block.type == 2) { // REPORTER
            if (context.inputList.length === 0 && block.option.monitor) {
                blockJSON.checkboxInFlyout = true;
            }
        }

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
            if (block.type === 5) {
                // TODO: shouldRestartExistingThreads ?
                // TODO: edgeActivated ?
                this.vm.runtime._hats[opcode] = {
                    edgeActivated: blockInfo.isEdgeActivated
                };
            }
        }

        this.blockInfo.push(blockInfo);
        this.blocks.set(block.opcode, block);

        return category;
    }

    _processBlockArguments (context, block) {
        const text = context.blockInfo.text;
        let inBranchNum = 0;
        let outLineNum = 0;
        // clear next arg
        context.blockJSON[`args${outLineNum}`] = [];

        const re = /\[(.+?)]/g;

        let searchResult = null;
        let convertedText = '';
        let lastIndex = 0;
        while ((searchResult = re.exec(text)) !== null) {
            convertedText += text.substr(lastIndex, searchResult.index - lastIndex);
            lastIndex = re.lastIndex;

            // Sanitize the placeholder to ensure valid XML
            let placeholder = searchResult[1].replace(/[<"&]/, '_');

            // Check whether it is an substack
            if (placeholder.startsWith('SUBSTACK')) { // script
                if (placeholder === 'SUBSTACK1') placeholder = 'SUBSTACK';
                context.blockJSON[`message${outLineNum}`] = convertedText;
                ++outLineNum;
                convertedText = '';

                context.blockJSON[`message${outLineNum}`] = '%1';
                context.blockJSON[`args${outLineNum}`] = [{
                    type: 'input_statement',
                    name: placeholder
                }];
                ++inBranchNum;
                ++outLineNum;
                ++context.blockInfo.branchCount;
                // clear next arg
                context.blockJSON[`args${outLineNum}`] = [];
                continue;
            }
            
            // create param lazily in order to avoid errors caused by BRANCH
            const param = block.param[placeholder] || {};

            // Determine whether the argument type is one of the known standard field types
            const argInfo = context.blockInfo.arguments[placeholder] || {};
            let argTypeInfo = ArgumentTypeMap[argInfo.type] || {};

            // Field type not a standard field type, see if extension has registered custom field type
            if (!ArgumentTypeMap[argInfo.type] && context.categoryInfo.customFieldTypes[argInfo.type]) {
                argTypeInfo = context.categoryInfo.customFieldTypes[argInfo.type].argumentTypeInfo;
            }

            // Start to construct the scratch-blocks style JSON defining how the block should be
            // laid out
            let argJSON;

            // Most field types are inputs (slots on the block that can have other blocks plugged into them)
            // check if this is not one of those cases. E.g. an inline image on a block.
            if (argTypeInfo.fieldType === 'field_image') {
                argJSON = this._constructInlineImageJson(argInfo);
            } else {
                // Construct input value

                // Layout a block argument (e.g. an input slot on the block)
                argJSON = {
                    type: 'input_value',
                    name: placeholder
                };

                const defaultValue = argInfo.defaultValue;

                if (argTypeInfo.check) {
                    // Right now the only type of 'check' we have specifies that the
                    // input slot on the block accepts Boolean reporters, so it should be
                    // shaped like a hexagon
                    argJSON.check = argTypeInfo.check;
                }

                let valueName, shadowType, fieldName;
                if (param.menu && param.field) {
                    argJSON.type = 'field_dropdown';
                    argJSON.options = param.menu.map(item => ([
                        formatMessage({
                            id: item.messageId,
                            default: item.messageId
                        }),
                        item.value
                    ]));
                    valueName = null;
                    shadowType = null;
                    fieldName = placeholder;
                } else if (param.menuId) {
                    valueName = placeholder;
                    shadowType = param.menuId;
                    fieldName = placeholder;
                } else {
                    valueName = placeholder;
                    shadowType = argInfo.shadow;
                    if (argInfo.shadow === undefined || argInfo.shadow === true) {
                        shadowType = (argTypeInfo.shadow && argTypeInfo.shadow.type) || null;
                        fieldName = (argTypeInfo.shadow && argTypeInfo.shadow.fieldName) || null;
                    }
                }

                // <value> is the ScratchBlocks name for a block input.
                if (valueName) {
                    context.inputList.push(`<value name="${placeholder}">`);
                }

                // The <shadow> is a placeholder for a reporter and is visible when there's no reporter in this input.
                // Boolean inputs don't need to specify a shadow in the XML.
                if (shadowType) {
                    context.inputList.push(`<shadow type="${shadowType}">`);
                }

                // A <field> displays a dynamic value: a user-editable text field, a drop-down menu, etc.
                // Leave out the field if defaultValue or fieldName are not specified
                if (defaultValue && fieldName) {
                    context.inputList.push(`<field name="${fieldName}">${defaultValue}</field>`);
                }

                if (shadowType) {
                    context.inputList.push('</shadow>');
                }

                if (valueName) {
                    context.inputList.push('</value>');
                }
            }

            const argsName = `args${outLineNum}`;
            const blockArgs = (context.blockJSON[argsName] = context.blockJSON[argsName] || []);
            if (argJSON) blockArgs.push(argJSON);
            const argNum = blockArgs.length;
            context.argsMap[placeholder] = argNum;

            convertedText += `%${argNum}`;
        }

        convertedText += text.substr(lastIndex, text.length - lastIndex);

        // Process the remaining string
        if (convertedText.length) {
            context.blockJSON[`message${outLineNum}`] = convertedText;
        }
    }

    removeBlocks (blockIds) {
        for (const blockId of blockIds) {
            this._removeBlock(blockId);
        }
        this.refreshBlocks();
    }

    removeBlock (blockId) {
        this._removeBlock(blockId);
        this.refreshBlocks();
    }

    /**
     * Helper for removing a block from its id.
     * @param {string} blockId block id
     */
    _removeBlock (blockId) {
        for (const i in this.vm.runtime._blockInfo) {
            const category = this.vm.runtime._blockInfo[i];
            for (const j in category.blocks){
                if (category.blocks[j].info.opcode === blockId) {
                    this.vm.runtime._blockInfo[i].blocks.splice(j, 1);
                    this.vm.emit('BLOCK_REMOVED', blockId);
                }
            }
        }
    }

    addCategory (category) {
        // 阻止多次添加同名 category
        if (!!this._getCategory(category.categoryId)) {
            console.warn('reject to add category twice');
            return;
        }
        
        const categoryInfo = {
            id: category.categoryId,
            messageId: category.messageId,
            name: formatMessage({
                id: category.messageId,
                default: category.messageId
            }),
            showStatusButton: category.showStatusButton,
            color1: category.color || '#0FBD8C',
            blocks: [],
            customFieldTypes: {},
            menus: [],
            menuInfo: {}
        };

        this.categoryInfo.push(categoryInfo);
        this.categories.set(category.categoryId, category);
        this.vm.runtime._blockInfo.push(categoryInfo);
        this.vm.emit('EXTENSION_ADDED', categoryInfo);
    }

    removeCategory (categoryId) {
        // 阻止卸载不存在 category
        if (!this._getCategory(categoryId)) {
            console.warn('reject to add category twice');
            return;
        }
        
        for (const i in this.vm.runtime._blockInfo) {
            const category = this.vm.runtime._blockInfo[i];
            if (category.id === categoryId) {
                this.vm.runtime._blockInfo.splice(i, 1);
                this.vm.emit('EXTENSION_REMOVED', categoryId);
            }
        }
        this.refreshBlocks();
    }

    getPlaygroundData () {
        return this.vm.getPlaygroundData();
    }

    loadProject (input) {
        return this.vm.loadProject(input);
    }

    /**
     * Helper for _convertPlaceholdes which handles inline images which are a specialized case of block "arguments".
     * @see runtime.js Runtime._constructInlineImageJson
     * @param {object} argInfo Metadata about the inline image as specified by the extension
     * @return {object} JSON blob for a scratch-blocks image field.
     * @private
     */
    _constructInlineImageJson (argInfo) {
        if (!argInfo.dataURI) {
            log.warn('Missing data URI in extension block with argument type IMAGE');
        }
        return {
            type: 'field_image',
            src: argInfo.dataURI || '',
            // TODO these probably shouldn't be hardcoded...?
            width: 24,
            height: 24,
            // Whether or not the inline image should be flipped horizontally
            // in RTL languages. Defaults to false, indicating that the
            // image will not be flipped.
            flip_rtl: argInfo.flipRTL || false
        };
    }
}

module.exports = ExtensionAPI;
