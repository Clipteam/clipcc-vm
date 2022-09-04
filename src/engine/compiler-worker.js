function workerFunc () {
    
// debug
const debug = false;
let myId = -1;

function output (...content) {
    if (!debug) return;
    console.log(...content);
}

output('worker created!');

// initialize
let promisePool = [];
let blockContainer = {};
self.onmessage = function ({data}) {
    const { operation, content } = data;
    switch (operation) {
    case 'initialize': {
        myId = content.id;
        break;
    }
    // Start generating code for the thread
    case 'start': {
        output('start');
        const { blocks, topBlockId } = content;
        blockContainer = blocks;
        // For worker, interacting with main thread should use promise.
        generateStack(topBlockId, false)
            .then((snippet, codename) => {
                self.postMessage({
                    operation: 'generated',
                    content: {
                        name: codename || 'main',
                        // use strict mode for optimization and avoid potential mistakes as much as possible
                        code: snippet,
                        id: myId
                    }
                })
            });
        break;
    }
    case 'resolvePromise': {
        output('resolvePromise', content);
        // Find the target promise, and resolve it.
        for (const promiseId in promisePool) {
            const promise = promisePool[promiseId];
            if (promise.type !== content.type) continue;
            if (promise.id !== content.id) continue;
            output('resolve it', content.result);
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
    output('generate stack ', topId);
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
 * @returns {string} generated code
 */
async function generateBlock (blockId, isWarp, paramNames) {
    const block = await getBlock(blockId);
    output('generate block ', block);
    
    const inputs = await processArguments(block, paramNames);
    switch (block.opcode) {
    // todo generate Javascript code for specific block 
    default: {
        // todo get compile function of extension
        // fallback to compatibility layer
        const convertedInput = [];
        for (const name in inputs) {
            const input = inputs[name];
            output(`input of block ${blockId} is `, input);
            convertedInput.push(`${name}: ${input.asString()}`);
        }
        return `yield* runInCompatibilityLayer("${block.opcode}", {${convertedInput.join(', ')}}, ${isWarp || false})`;
    }
    }
}

async function processArguments (block, paramNames) {
    const args = {};
    // Read from inputs
    for (const name in block.inputs) {
        const input = block.inputs[name];
        const inputBlock = await getBlock(input.block);
        args[name] = await decodeInput(inputBlock, name, paramNames);
    }
    // Read from fields
    for (const name in block.fields) {
        if (name === 'VARIABLE') {
            args[name] = new CompiledInput(
                block.fields[name].id,
                CompiledInput.TYPE_DYNAMIC,
                true
            );
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

async function decodeInput (inputBlock, name, paramNames) {
    switch (inputBlock.opcode) {
    // function
    case 'argument_reporter_boolean':
    case 'argument_reporter_string_number': {
        // follow the original logic of Scratch
        const index = paramNames.lastIndexOf(inputBlock.fields.VALUE.value);
        return new CompiledInput(
            `(parameter[${index}] || 0)`,
            CompiledInput.TYPE_STRING,
            false
        )
    }
    // basic
    case 'colour_picker': {
        return new CompiledInput(
            inputBlock.fields.COLOUR.value,
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
            inputBlock.fields.TEXT.value,
            CompiledInput.TYPE_STRING,
            true
        );
    }
    // menu
    case 'sound_sounds_menu': {
        return new CompiledInput(
            inputBlock.fields.SOUND_MENU.value,
            CompiledInput.TYPE_STRING,
            true
        );
    }
    case 'event_broadcast_menu': {
        const broadcastOption = inputBlock.fields.BROADCAST_OPTION;
        const broadcastVariable = this.thread.target.lookupBroadcastMsg(broadcastOption.id, broadcastOption.value);
        const result = broadcastVariable ? `${broadcastVariable.name}` : '';
        return new CompiledInput(
            result,
            CompiledInput.TYPE_STRING,
            true
        );
    }
    // more interesting
    default: {
        // For all branch, use SUBSTACK prefix.
        if (name.startsWith('SUBSTACK')) {
            const result = await generateStack(inputBlock.id);
            return new CompiledInput(
                result,
                CompiledInput.TYPE_DYNAMIC,
                true
            );
        }
        
        // For most cases, this is a nested input.
        try {
            const result = await generateBlock(inputBlock.id);
            return new CompiledInput(
                result,
                CompiledInput.TYPE_DYNAMIC,
                false
            );
        } catch (e) {
            // edge case: It's a unknown menu...?
            // inspired by Turbowarp, although I have not encountered this situation
            const inputs = Object.keys(inputBlock.inputs);
            const fields = Object.keys(inputBlock.fields);
            if (inputs.length === 0 && fields.length === 1) {
                return new CompiledInput(
                    inputBlock.fields[fields[0]].value,
                    CompiledInput.TYPE_STRING,
                    true
                );
            }
            
            throw new Error(`cannot generate input ${input.name}:\n ${e.message}`);
        }
    }
    }
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

function getBlock (blockId) {
    // If it's exist in block container, use it
    if (blockContainer.hasOwnProperty(blockId)) {
        return Promise.resolve(blockContainer[blockId]);
    }
    // get it from main thread
    return new Promise((resolve, reject) => {
        promisePool.push({
            type: 'getBlock',
            id: blockId,
            resolve,
            reject
        });
        self.postMessage({
            operation: 'getBlock',
            content: {
                id: blockId
            }
        });
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
        this.value = value;
        this.type = type;
        this.constant = constant;
    }

    static get TYPE_ALWAYS_NUMBER () {
        return 0;
    }

    static get TYPE_NUMBER () {
        return 1;
    }

    static get TYPE_STRING () {
        return 2;
    }

    static get TYPE_BOOLEAN () {
        return 3;
    }

    static get TYPE_DYNAMIC () {
        return 4;
    }

    raw () {
        return this.value;
    }

    asString () {
        if (this.type === CompiledInput.TYPE_ALWAYS_NUMBER) return this.value;
        if (this.constant) return JSON.stringify(`${this.value}`);
        if (this.type === CompiledInput.TYPE_STRING) return this.value;
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
        if (this.constant) return this.asPureNumber();
        return `(+(${this.value}))`;
    }

    asBoolean () {
        if (this.type === CompiledInput.TYPE_BOOLEAN) return this.value;
        if (this.constant) return Cast.toBoolean(this.value).toString();
        // Scratch 3 is more complicated for boolean type conversion
        // Processed it during runtime in the case of non-constant
        return `util.toBoolean(${this.value})`;
    }
}
}

module.exports = `(${workerFunc.toString()})()`;
