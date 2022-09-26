/**
 * @fileoverview
 * Convert block stack to core.
 */
 
function workerFunc () {
const debug = true;
let myId = -1;
let varCount = 0;
let entryBlock = null;

function output (...content) {
    if (!debug) return;
    console.log(`[Worker ${myId}]`, ...content);
}

// initialize
let promisePool = [];
let blockContainer = {};
let dependencies = new Set();

self.onmessage = function ({data}) {
    const { operation, content } = data;
    switch (operation) {
    case 'initialize': {
        myId = content.id;
        output('initialized!');
        break;
    }
    // Start generating code for the thread
    case 'start': {
        output('start');
        const { blocks, topBlockId, workerId } = content;
        entryBlock = topBlockId;
        blockContainer = blocks;
        varCount = 0;
        dependencies = new Set();
        myId = workerId;
        // For worker, interacting with main thread should use promise.
        generateStack(topBlockId, false)
            .then((snippet) => {
                blockContainer = {};
                self.postMessage({
                    operation: 'generated',
                    content: {
                        name: 'main',
                        code: snippet,
                        entry: topBlockId,
                        dependencies: Array.from(dependencies),
                        id: myId
                    }
                })
            })
            .catch(e => {
                self.postMessage({
                    operation: 'error',
                    content: {
                        name: 'main',
                        error: e,
                        id: myId,
                        entry: topBlockId
                    }
                })
            });
        break;
    }
    case 'resolvePromise': {
        // Find the target promise, and resolve it.
        for (const promiseId in promisePool) {
            const promise = promisePool[promiseId];
            if (promise.type !== content.type) continue;
            if (promise.id !== content.id) continue;
            promise.resolve(content.result);
            delete promisePool[promiseId];
            break;
        }
        break;
    }
    default: 
        console.error('unknown message', data);
    }
}

/**
 * Generates javaScript code of a block stack
 * @param {string} topId - the top block id of block stack
 * @param {boolean} isWarp - Whether yield in loop
 * @param {string[]} paramNames - parameter name of block stack
 * @returns {string} generated code
 */
async function generateStack (topId, isWarp, paramNames) {
    output('generate stack ', topId, isWarp, paramNames);
    const compiledStack = [];
    // If the top block is a hat, skip it.
    let currentBlockId = (await isHat(await getBlock(topId)))
        ? (await getBlock(topId)).next : topId;
    while (currentBlockId !== null) {
        compiledStack.push(await generateBlock(currentBlockId, isWarp, paramNames));
        currentBlockId = (await getBlock(currentBlockId)).next;
    }
    // output('result: \\n' + compiledStack.join('\\n'));
    return compiledStack.join('\n');
}

/**
 * Generates javaScript code of a block 
 * @param {string} blockId - the block id
 * @param {boolean} isWarp - Whether yield in loop
 * @param {string[]} paramNames - parameter name of block stack
 * @param {boolean} asReporter - generate block as reporter
 * @returns {string} generated code
 */
async function generateBlock (blockId, isWarp, paramNames, asReporter) {
    const block = await getBlock(blockId);
    output('generate block ', block);
    
    const args = await processArguments(block, paramNames);
    output('args is', args);
    switch (block.opcode) {
    // Control
    case 'control_repeat': {
        output(args.TIMES);
        return `for (let i = ${args.TIMES.asPureNumber()}; i >= 0.5; i--){\n` +
        `${args.SUBSTACK ? args.SUBSTACK.raw() : '// null'}\n` +
        (isWarp ? `if (util.needRefresh()) yield\n` : 'yield\n') +
        `}`;
    }
    case 'control_repeat_until': {
        return `while(!${args.CONDITION ? args.CONDITION.asBoolean() : 'false'}){\n` +
        `${args.SUBSTACK ? args.SUBSTACK.raw() : '// null'}\n` +
        (isWarp ? `if (util.needRefresh()) yield\n` : 'yield\n') +
        `}`;
    }
    case 'control_while': {
        return `while(${args.CONDITION ? args.CONDITION.asBoolean() : 'false'}){\n` +
        `${args.SUBSTACK ? args.SUBSTACK.raw() : '// null'}\n` +
        (isWarp ? `if (util.needRefresh()) yield\n` : 'yield\n') +
        `}`;
    }
    case 'control_wait_until': {
        return `while(!${args.CONDITION ? args.CONDITION.asBoolean() : 'false'}){\n` +
        (isWarp ? `if (util.needRefresh()) yield\n` : 'yield\n') +
        `}`;
    }
    case 'control_forever': {
        return `while(true) {\n` +
        `${args.SUBSTACK ? args.SUBSTACK.raw() : '// null'}\n` +
        (isWarp ? `if (util.needRefresh()) yield\n` : 'yield\n') +
        `}`;
    }
    case 'control_wait': {
        varCount++;
        const base = `util.thread.timer = util.getTimer()\n` +
        `const ${`var_${varCount}`} = Math.max(0, 1000 * ${args.DURATION.asPureNumber()})\n` +
        `util.runtime.requestRedraw()\n` +
        `yield\n` +
        `while (util.thread.timer.timeElapsed() < ${`var_${varCount}`}) {\n`;
        if (isWarp) return `${base}if (util.needRefresh()) yield\n}\nutil.thread.timer = null`;
        return `${base}yield\n}\nutil.thread.timer = null`;
    }
    case 'control_suspend': {
        return 'yield';
    }
    case 'control_breakpoint': {
        return '// todo';
    }
    case 'control_if': {
        return `if (${args.CONDITION ? args.CONDITION.asBoolean() : 'false'}) {\n` +
        `${args.SUBSTACK ? args.SUBSTACK.raw() : '// null'}\n` +
        `}`;
    }
    case 'control_if_else': {
        return `if (${args.CONDITION ? args.CONDITION.asBoolean() : 'false'}) {\n` +
        `${args.SUBSTACK ? args.SUBSTACK.raw() : '// null'}\n` +
        `} else {\n` +
        `${args.SUBSTACK2 ? args.SUBSTACK2.raw() : '// null'}\n` +
        `}`;
    }
    case 'control_stop': {
        const option = args.STOP_OPTION.raw();
        if (option === 'all') {
            return `util.stopAll()`;
        }
        if (option === 'this script') {
            // If it's a procedure, just return it.
            if (paramNames) {
                return `return`;
            } else return `util.sequencer.retireThread(util.thread);yield;`;
        }
        if (option === 'other scripts in sprite' || option === 'other scripts in stage') {
            return `util.runtime.stopForTarget(util.target, util.thread)`;
        }
        return `// no-op`;
    }
    // Event
    case 'event_broadcast': {
        return `util.startHats("event_whenbroadcastreceived", { BROADCAST_OPTION: ${args.BROADCAST_INPUT.asString()} })`;
    }
    case 'event_broadcastandwait': {
        return `yield* util.waitThreads(util.startHats("event_whenbroadcastreceived", { BROADCAST_OPTION: ${args.BROADCAST_INPUT.asString()} }))`;
    }
    case 'event_whentouchingobject': {
        return `util.target.isTouchingObject(${args.TOUCHINGOBJECTMENU.asString()})`;
    }
    // Data
    case 'data_variable': {
        const { id, name } = args.VARIABLE;
        return new CompiledInput(
            `packageInstances['scratch3_data']._getVariable(${id.asString()}, ${name.asString()}, util)`,
            CompiledInput.TYPE_STRING,
            false
        );
    }
    case 'data_setvariableto': {
        const { id, name } = args.VARIABLE;
        return `packageInstances['scratch3_data']._setVariableTo(${id.asString()}, ${name.asString()}, ${args.VALUE.asString()}, util)`;
    }
    case 'data_changevariableby': {
        const { id, name } = args.VARIABLE;
        return `packageInstances['scratch3_data']._changeVariableBy(${id.asString()}, ${name.asString()}, ${args.VALUE.asString()}, util)`;
    }
    case 'data_hidevariable': {
        const { id, name } = args.VARIABLE;
        return `packageInstances['scratch3_data'].changeMonitorVisibility(${id.asString()}, false)`;
    }
    case 'data_showvariable': {
        const { id, name } = args.VARIABLE;
        return `packageInstances['scratch3_data'].changeMonitorVisibility(${id.asString()}, true)`;
    }
    case 'data_listcontents': {
        const { id, name } = args.LIST;
        return new CompiledInput(
            `packageInstances['scratch3_data']._getListContents(${id.asString()}, ${name.asString()}, util)`,
            CompiledInput.TYPE_STRING,
            false
        );
    }
    case 'data_addtolist': {
        const { id, name } = args.LIST;
        return `packageInstances['scratch3_data']._addToList(${id.asString()}, ${name.asString()}, ${args.ITEM.asSafe()}, util)`;
    }
    case 'data_deleteoflist': {
        const { id, name } = args.LIST;
        return `packageInstances['scratch3_data']._deleteOfList(${id.asString()}, ${name.asString()}, ${args.INDEX.raw()}, util)`;
    }
    case 'data_deletealloflist': {
        const { id, name } = args.LIST;
        return `packageInstances['scratch3_data']._deleteAllOfList(${id.asString()}, ${name.asString()}, util)`;
    }
    case 'data_insertatlist': {
        const { id, name } = args.LIST;
        return `packageInstances['scratch3_data']._insertAtList(${id.asString()}, ${name.asString()}, ${args.ITEM.asSafe()}, ${args.INDEX.raw()}, util)`;
    }
    case 'data_replaceitemoflist': {
        const { id, name } = args.LIST;
        return `packageInstances['scratch3_data']._replaceItemOfList(${id.asString()}, ${name.asString()}, ${args.ITEM.asSafe()}, ${args.INDEX.raw()}, util)`;
    }
    case 'data_itemoflist': {
        const { id, name } = args.LIST;
        return new CompiledInput(
            `packageInstances['scratch3_data']._getItemOfList(${id.asString()}, ${name.asString()}, ${args.INDEX.raw()}, util)`,
            CompiledInput.TYPE_DYNAMIC,
            false
        );
    }
    case 'data_itemnumoflist': {
        const { id, name } = args.LIST;
        return new CompiledInput(
            `packageInstances['scratch3_data']._getItemNumOfList(${id.asString()}, ${name.asString()}, ${args.ITEM.asSafe()}, util)`,
            CompiledInput.TYPE_NUMBER,
            false
        );
    }
    case 'data_lengthoflist': {
        const { id, name } = args.LIST;
        return new CompiledInput(
            `packageInstances['scratch3_data']._lengthOfList(${id.asString()}, ${name.asString()}, util)`,
            CompiledInput.TYPE_NUMBER,
            false
        );
    }
    case 'data_listcontainsitem': {
        const { id, name } = args.LIST;
        return new CompiledInput(
            `packageInstances['scratch3_data']._listContainsItem(${id.asString()}, ${name.asString()}, ${args.ITEM.asSafe()}, util)`,
            CompiledInput.TYPE_BOOLEAN,
            false
        );
    }
    case 'data_hidelist': {
        const { id, name } = args.LIST;
        return `packageInstances['scratch3_data'].changeMonitorVisibility(${id.asString()}, false)`;
    }
    case 'data_showlist': {
        const { id, name } = args.LIST;
        return `packageInstances['scratch3_data'].changeMonitorVisibility(${id.asString()}, true)`;
    }
    // Operator
    case 'operator_add': {
        return new CompiledInput(
            `${args.NUM1.asNumber()} + ${args.NUM2.asNumber()}`,
            CompiledInput.TYPE_NUMBER_NAN,
            false
        );
    }
    case 'operator_subtract': {
        return new CompiledInput(
            `${args.NUM1.asNumber()} - ${args.NUM2.asNumber()}`,
            CompiledInput.TYPE_NUMBER_NAN,
            false
        );
    }
    case 'operator_multiply': {
        return new CompiledInput(
            `${args.NUM1.asNumber()} * ${args.NUM2.asNumber()}`,
            CompiledInput.TYPE_NUMBER_NAN,
            false
        );
    }
    case 'operator_divide': {
        return new CompiledInput(
            `${args.NUM1.asNumber()} / ${args.NUM2.asNumber()}`,
            CompiledInput.TYPE_NUMBER_NAN,
            false
        );
    }
    case 'operator_lt': {
        return new CompiledInput(
            `util.lt(${args.OPERAND1.asString()}, ${args.OPERAND2.asString()})`,
            CompiledInput.TYPE_BOOLEAN,
            false
        );
    }
    case 'operator_le': {
        return new CompiledInput(
            `util.le(${args.OPERAND1.asString()}, ${args.OPERAND2.asString()})`,
            CompiledInput.TYPE_BOOLEAN,
            false
        );
    }
    case 'operator_equals': {
        return new CompiledInput(
            `util.eq(${args.OPERAND1.asString()}, ${args.OPERAND2.asString()})`,
            CompiledInput.TYPE_BOOLEAN,
            false
        );
    }
    case 'operator_gt': {
        return new CompiledInput(
            `util.gt(${args.OPERAND1.asString()}, ${args.OPERAND2.asString()})`,
            CompiledInput.TYPE_BOOLEAN,
            false
        );
    }
    case 'operator_ge': {
        return new CompiledInput(
            `util.ge(${args.OPERAND1.asString()}, ${args.OPERAND2.asString()})`,
            CompiledInput.TYPE_BOOLEAN,
            false
        );
    }
    case 'operator_and': {
        return new CompiledInput(
            `${args.OPERAND1? args.OPERAND1.asBoolean() : false} && ${args.OPERAND2? args.OPERAND2.asBoolean() : false}`,
            CompiledInput.TYPE_BOOLEAN,
            false
        );
    }
    case 'operator_or': {
        return new CompiledInput(
            `${args.OPERAND1? args.OPERAND1.asBoolean() : false} || ${args.OPERAND2? args.OPERAND2.asBoolean() : false}`,
            CompiledInput.TYPE_BOOLEAN,
            false
        );
    }
    case 'operator_not': {
        return new CompiledInput(
            `!${args.OPERAND? args.OPERAND.asBoolean() : false}`,
            CompiledInput.TYPE_BOOLEAN,
            false
        );
    }
    // Functions
    case 'argument_reporter_boolean':
    case 'argument_reporter_string_number': {
        // follow the original logic of Scratch
        const index = paramNames ? paramNames.lastIndexOf(inputBlock.fields.VALUE.value) : 0;
        return new CompiledInput(
            `(params[${index}] || 0)`,
            CompiledInput.TYPE_STRING,
            false
        );
    }
    case 'procedures_call_return': {
        // get parameters
        const [_paramNames, _paramIds, _paramDefaults] = await getProcedureParamNamesIdsAndDefaults(block.mutation.proccode);
        const definitionId = await getProcedureDefinition(block.mutation.proccode);
        if (!definitionId) return `/*headless call ${block.mutation.proccode}*/`;
        
        const params = args.mutation.join(', ');
        const base =  `yield* ${makeSafe(block.mutation.proccode)}(util, [${params}])`;
        
        if (dependencies.has(makeSafe(block.mutation.proccode))) {
            return new CompiledInput(
                base,
                CompiledInput.TYPE_STRING,
                false
            );
        }
        dependencies.add(makeSafe(block.mutation.proccode));
        
        output(_paramNames, _paramIds, _paramDefaults, definitionId);
        return generateStack(definitionId, block.mutation.warp === 'true', _paramNames)
            .then((snippet) => {
                self.postMessage({
                    operation: 'procedure',
                    content: {
                        name: makeSafe(block.mutation.proccode),
                        entry: entryBlock,
                        code: snippet,
                        id: myId
                    }
                });
                return new CompiledInput(
                    base,
                    CompiledInput.TYPE_STRING,
                    false
                );
            })
            .catch(e => {
                self.postMessage({
                    operation: 'error',
                    content: {
                        name: makeSafe(block.mutation.proccode),
                        error: e,
                        id: myId
                    }
                });
            });
    }
    case 'procedures_call': {
        // get parameters
        const [_paramNames, _paramIds, _paramDefaults] = await getProcedureParamNamesIdsAndDefaults(block.mutation.proccode);
        const definitionId = await getProcedureDefinition(block.mutation.proccode);
        if (!definitionId) return `/*headless call ${block.mutation.proccode}*/`;
        
        const params = args.mutation.join(', ');
        const base =  `yield* ${makeSafe(block.mutation.proccode)}(util, [${params}])`;
        
        if (dependencies.has(makeSafe(block.mutation.proccode))) return base;
        dependencies.add(makeSafe(block.mutation.proccode));
        
        output(_paramNames, _paramIds, _paramDefaults, definitionId);
        return generateStack(definitionId, block.mutation.warp === 'true', _paramNames)
            .then((snippet) => {
                self.postMessage({
                    operation: 'procedure',
                    content: {
                        name: makeSafe(block.mutation.proccode),
                        entry: entryBlock,
                        code: snippet,
                        id: myId
                    }
                });
                return base;
            })
            .catch(e => {
                self.postMessage({
                    operation: 'error',
                    content: {
                        name: makeSafe(block.mutation.proccode),
                        error: e,
                        id: myId
                    }
                });
            });
    }
    case 'procedures_return': {
        return `return ${args.VALUE.asString()}`;
    }
    default: {
        // todo get compile function of extension
        // fallback to compatibility layer
        const convertedInput = [];
        for (const name in args) {
            const input = args[name];
            output(`input of block ${blockId} is `, input);
            convertedInput.push(`${name}: ${input.asString()}`);
        }
        if (asReporter) {
            return new CompiledInput(
                `(yield* util.runInCompatibilityLayer("${block.opcode}", {${convertedInput.join(', ')}}, ${isWarp || false}))`,
                CompiledInput.TYPE_DYNAMIC,
                false
            );
        }
        return `yield* util.runInCompatibilityLayer("${block.opcode}", {${convertedInput.join(', ')}}, ${isWarp || false})`;
    }
    }
}

/**
 * Process arguments for a block.
 * @param {Block} block - the block that need to be processed.
 * @param {string[]} paramNames - parameter name of block stack.
 * @returns {object} arguments of the block.
 */
async function processArguments (block, paramNames) {
    const args = {};
    // It's for procedures now, maybe we should implement variable parameters support?
    if (block.hasOwnProperty('mutation')) {
        args.mutation = [];
        
        if (block.mutation.argumentids) {
            const mapping = JSON.parse(block.mutation.argumentids);
            for (const item of mapping) {
                const input = block.inputs[item];
                if (!input) {
                    args.mutation.push('null');
                    continue;
                }
                if (input.block === input.shadow) { // Non-nested reporter, get the value directly
                    const inputBlock = await getBlock(input.block);
                    args.mutation.push(`${(await decodeInput(inputBlock, '%', paramNames)).value}`);
                } else {
                    const targetCode = await generateBlock(input.block, false, paramNames, true);
                    args.mutation.push(`"" +(${targetCode.asSafe()})`);
                }
            }
        }
    }
    // Read from inputs
    for (const name in block.inputs) {
        const input = block.inputs[name];
        const inputBlock = await getBlock(input.block);
        args[name] = await decodeInput(inputBlock, name, paramNames);
    }
    // Read from fields
    for (const name in block.fields) {
        if (name === 'VARIABLE' || name === 'LIST') {
            args[name] = {
                id: new CompiledInput(block.fields[name].id, CompiledInput.TYPE_DYNAMIC, true),
                name: new CompiledInput(block.fields[name].value, CompiledInput.TYPE_DYNAMIC, true)
            };
        } else {
            args[name] = new CompiledInput(
                block.fields[name].value,
                CompiledInput.TYPE_DYNAMIC,
                true
            );
        }
    }
    
    return args;
}

function makeSafe (proccode) {
    return proccode.replace(/%[\w]/g, '').replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Decode a input block.
 * @param {Block} inputBlock - the input block.
 * @param {string} name - input's name
 * @param {string[]} paramNames - parameter name of block stack.
 * @returns {CompiledInput} the input unit.
 */
async function decodeInput (inputBlock, name, paramNames) {
    output('decodeInput', inputBlock, name, paramNames);
    if (!inputBlock) {
        return new CompiledInput(
            '',
            CompiledInput.TYPE_STRING,
            true
        );
    }
    // For all branch, use SUBSTACK prefix.
    if (name.startsWith('SUBSTACK')) {
        const result = await generateStack(inputBlock.id);
        return new CompiledInput(
            result,
            CompiledInput.TYPE_DYNAMIC,
            true
        );
    }
    
    switch (inputBlock.opcode) {
    // This shouldn't be here, but we had to introduce a redundant generation mechanism here before all the blocks were compiled and optimized.
    case 'argument_reporter_boolean':
    case 'argument_reporter_string_number': {
        // follow the original logic of Scratch
        const index = paramNames ? paramNames.lastIndexOf(inputBlock.fields.VALUE.value) : 0;
        return new CompiledInput(
            `(params[${index}] || 0)`,
            CompiledInput.TYPE_STRING,
            false
        );
    }
    // basic
    case 'colour_picker': {
        return new CompiledInput(
            `"${inputBlock.fields.COLOUR.value}"`,
            CompiledInput.TYPE_ALWAYS_NUMBER,
            true
        );
    }
    case 'math_angle':
    case 'math_integer':
    case 'math_number':
    case 'math_positive_number':
    case 'math_whole_number': {
        return new CompiledInput(
            inputBlock.fields.NUM.value,
            CompiledInput.TYPE_NUMBER,
            true
        );
    }
    case 'text': {
        return new CompiledInput(
            `"${inputBlock.fields.TEXT.value}"`,
            CompiledInput.TYPE_STRING,
            true
        );
    }
    // menu
    case 'sound_sounds_menu': {
        return new CompiledInput(
            `"${inputBlock.fields.SOUND_MENU.value}"`,
            CompiledInput.TYPE_STRING,
            true
        );
    }
    case 'event_broadcast_menu': {
        const broadcastOption = inputBlock.fields.BROADCAST_OPTION;
        const broadcastVariable = await lookupBroadcastMsg(broadcastOption.id, broadcastOption.value);
        const result = broadcastVariable ? `"${broadcastVariable.name}"` : '';
        return new CompiledInput(
            result,
            CompiledInput.TYPE_STRING,
            true
        );
    }
    // more interesting
    default: {
        try {
            // edge case: It's a unknown menu...?
            // inspired by Turbowarp, although I have not encountered this situation
            const inputs = Object.keys(inputBlock.inputs);
            const fields = Object.keys(inputBlock.fields);
            if (inputs.length === 0 && fields.length === 1) {
                if (fields[0] === 'VARIABLE' || fields[0] === 'LIST') {
                    const result = await generateBlock(inputBlock.id, false, paramNames, true);
                    return result;
                }
                return new CompiledInput(
                    `"${inputBlock.fields[fields[0]].value}"`,
                    CompiledInput.TYPE_STRING,
                    true
                );
            }
            
            // @todo use Compatibility Layers only for specified blocks.
            // For most cases, this is a nested input.
            const result = await generateBlock(inputBlock.id, false, paramNames, true);
            return result;
        } catch (e) {
            throw new Error(`cannot generate input ${inputBlock.opcode}:\n ${e.message}`);
        }
    }
    }
}

function getProcedureDefinition (proccode) {
    return new Promise((resolve, reject) => {
        promisePool.push({
            type: 'getProcedureDefinition',
            id: proccode,
            resolve,
            reject
        });
        self.postMessage({
            operation: 'getProcedureDefinition',
            content: {
                entry: entryBlock,
                id: proccode
            }
        });
    });
}

function getProcedureParamNamesIdsAndDefaults (proccode) {
    return new Promise((resolve, reject) => {
        promisePool.push({
            type: 'getProcedureParamNamesIdsAndDefaults',
            id: proccode,
            resolve,
            reject
        });
        self.postMessage({
            operation: 'getProcedureParamNamesIdsAndDefaults',
            content: {
                entry: entryBlock,
                id: proccode
            }
        });
    });
}

function isHat (block) {
    if (block.opcode === 'procedures_definition') return Promise.resolve(true);
    if (block.opcode === 'procedures_definition_return') return Promise.resolve(true);
    
    return new Promise((resolve, reject) => {
        promisePool.push({
            type: 'isHat',
            id: block.id,
            resolve,
            reject
        });
        self.postMessage({
            operation: 'isHat',
            content: {
                id: block.id,
                opcode: block.opcode
            }
        });
    });
}

function lookupBroadcastMsg (id, value) {
    return new Promise((resolve, reject) => {
        promisePool.push({
            type: 'lookupBroadcastMsg',
            id,
            resolve,
            reject
        });
        self.postMessage({
            operation: 'lookupBroadcastMsg',
            content: {
                entry: entryBlock,
                id,
                value
            }
        });
    });
}

function getBlock (blockId) {
    // If it's exist in block container, use it
    if (blockContainer.hasOwnProperty(blockId)) {
        return Promise.resolve(blockContainer[blockId]);
    }
    
    // get it from main thread
    return new Promise((resolve, reject) => {
        promisePool.push({
            type: 'getBlocks',
            id: entryBlock,
            resolve,
            reject
        });
        self.postMessage({
            operation: 'getBlocks',
            content: {
                entry: entryBlock
            }
        });
    }).then(newBlocks => {
        blockContainer = newBlocks;
        return blockContainer[blockId];
    });
}

class CompiledInput {
    /**
     * Compiled Input
     * @param {any} value
     * @param {number} type
     * @param {boolean} constant
     */
    constructor (value, type, constant = false) {
        this.type = type;
        this.constant = constant;
        this.value = value;
    }

    static get TYPE_ALWAYS_NUMBER () {
        return 0;
    }

    static get TYPE_NUMBER () {
        return 1;
    }
    
    static get TYPE_NUMBER_NAN () {
        return 2;
    }

    static get TYPE_STRING () {
        return 3;
    }

    static get TYPE_BOOLEAN () {
        return 4;
    }

    static get TYPE_DYNAMIC () {
        return 5;
    }
    
    static toBoolean (value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            if ((value === '') ||
                (value === '0') ||
                (value.toLowerCase() === 'false')) {
                return false;
            }
            return true;
        }
        return Boolean(value);
    }

    raw () {
        return this.value;
    }
    
    asSafe () {
        if (this.constant) return this.asString();
        return this.raw();
    }

    asString () {
        if (this.type === CompiledInput.TYPE_ALWAYS_NUMBER) return this.value;
        if (this.type === CompiledInput.TYPE_STRING) return this.value;
        if (this.constant) return JSON.stringify(`${this.value}`);
        return `("" + (${this.value}))`;
    }

    asPureNumber () {
        if (this.constant) {
            const temp = +this.value;
            if (temp) return temp.toString();
            if (Object.is(temp, -0)) return '-0';
            return '0';
        }
        return `(+(${this.value}) || 0)`;
    }

    asNumber () {
        if (this.type === CompiledInput.TYPE_NUMBER) return this.value;
        if (this.type === CompiledInput.TYPE_NUMBER_NAN) return this.asPureNumber();
        if (this.constant) return this.asPureNumber();
        return `(+(${this.value}))`;
    }

    asBoolean () {
        if (this.type === CompiledInput.TYPE_BOOLEAN) return this.value;
        if (this.constant) return CompiledInput.toBoolean(this.value).toString();
        // Scratch 3 is more complicated for boolean type conversion
        // Processed it during runtime in the case of non-constant
        return `util.toBoolean(${this.value})`;
    }
}
}

module.exports = `(${workerFunc.toString()})()`;
