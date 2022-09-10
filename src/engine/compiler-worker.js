function workerFunc () {
    
const debug = true;
let myId = -1;
let varCount = 0;
let entryBlock = null;

function output (...content) {
    if (!debug) return;
    console.log(`[Worker ${myId}]`, ...content);
}

output('created!');

// initialize
let promisePool = [];
let blockContainer = {};
let dependencies = new Set();

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
        entryBlock = topBlockId;
        blockContainer = blocks;
        varCount = 0;
        dependencies = new Set();
        // For worker, interacting with main thread should use promise.
        generateStack(topBlockId, false)
            .then((snippet, codename) => {
                self.postMessage({
                    operation: 'generated',
                    content: {
                        name: codename || 'main',
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
                        entry: topBlockId,
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
    
    const args = await processArguments(block, paramNames);
    output('args is', args);
    switch (block.opcode) {
    // Control
    case 'control_repeat': {
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
        if (option === 'all') return `util.stopAll()`;
        if (option === 'this script') return `return`;
        if (option === 'other scripts in sprite' || option === 'other scripts in stage') return `util.runtime.stopForTarget(util.target, util.thread)`;
        return `// no-op`;
    }
    // Operator
    case 'operator_add': {
        if (args.NUM1.constant && args.NUM2.constant) return `${args.NUM1.raw() + args.NUM2.raw()}`;
        return `${args.NUM1.asNumber()} + ${args.NUM2.asNumber()}`;
    }
    case 'operator_subtract': {
        if (args.NUM1.constant && args.NUM2.constant) return `${args.NUM1.raw() - args.NUM2.raw()}`;
        return `${args.NUM1.asNumber()} - ${args.NUM2.asNumber()}`;
    }
    case 'operator_multiply': {
        if (args.NUM1.constant && args.NUM2.constant) return `${args.NUM1.raw() * args.NUM2.raw()}`;
        return `${args.NUM1.asNumber()} * ${args.NUM2.asNumber()}`;
    }
    case 'operator_divide': {
        if (args.NUM1.constant && args.NUM2.constant) return `${args.NUM1.raw() / args.NUM2.raw()}`;
        return `${args.NUM1.asNumber()} / ${args.NUM2.asNumber()}`;
    }
    case 'operator_lt': {
        return `util.lt(${args.OPERAND1.asString()}, ${args.OPERAND2.asString()})`;
    }
    case 'operator_le': {
        return `util.le(${args.OPERAND1.asString()}, ${args.OPERAND2.asString()})`;
    }
    case 'operator_equals': {
        return `util.eq(${args.OPERAND1.asString()}, ${args.OPERAND2.asString()})`;
    }
    case 'operator_gt': {
        return `util.gt(${args.OPERAND1.asString()}, ${args.OPERAND2.asString()})`;
    }
    case 'operator_ge': {
        return `util.ge(${args.OPERAND1.asString()}, ${args.OPERAND2.asString()})`;
    }
    case 'operator_and': {
        return `${args.OPERAND1 ? args.OPERAND1.asBoolean() : 'false'} && ${args.OPERAND2 ? args.OPERAND2.asBoolean() : 'false'}`;
    }
    case 'operator_or': {
        return `${args.OPERAND1 ? args.OPERAND1.asBoolean() : 'false'} || ${args.OPERAND2 ? args.OPERAND2.asBoolean() : 'false'}`;
    }
    case 'operator_not': {
        return `!${args.OPERAND ? args.OPERAND.asBoolean() : 'false'}`;
    }
    // Functions
    case 'procedures_call_return':
    case 'procedures_call': {
        // get parameters
        const [_paramNames, _paramIds, _paramDefaults] = await getProcedureParamNamesIdsAndDefaults(block.mutation.proccode);
        const definitionId = await getProcedureDefinition(block.mutation.proccode);
        if (!definitionId) return `/*headless call ${block.mutation.proccode}*/`;
        
        const params = args.mutation.join(', ');
        const base =  `yield* f${hash(block.mutation.proccode)}(util, [${params}])`;
        
        if (dependencies.has(hash(block.mutation.proccode))) return base;
        
        dependencies.add(hash(block.mutation.proccode));
        output(_paramNames, _paramIds, _paramDefaults, definitionId);
        return generateStack(definitionId, block.mutation.warp === 'true', _paramNames)
            .then((snippet) => {
                self.postMessage({
                    operation: 'procedure',
                    content: {
                        name: hash(block.mutation.proccode),
                        entry: entryBlock,
                        code: snippet
                    }
                });
                return base;
            })
            .catch(e => {
                self.postMessage({
                    operation: 'error',
                    content: {
                        name: hash(block.mutation.proccode),
                        error: e
                    }
                });
            });
    }
    case 'procedures_return': {
        return `return ${args.VALUE.asString()}`;
    }
    // todo generate Javascript code for specific block 
    default: {
        // todo get compile function of extension
        // fallback to compatibility layer
        const convertedInput = [];
        for (const name in args) {
            const input = args[name];
            output(`input of block ${blockId} is `, input);
            convertedInput.push(`${name}: ${input.asString()}`);
        }
        return `yield* util.runInCompatibilityLayer("${block.opcode}", {${convertedInput.join(', ')}}, ${isWarp || false})`;
    }
    }
}

async function processArguments (block, paramNames) {
    const args = {};
    if (block.hasOwnProperty('mutation')) {
        args.mutation = [];
        const mapping = JSON.parse(block.mutation.argumentids);
        for (const item of mapping) {
            const input = block.inputs[item];
            if (!input) {
                args.mutation.push('null');
                continue;
            }
            if (input.block === input.shadow) { // Non-nested reporter, get the value directly
                const inputBlock = await getBlock(input.block);
                args.mutation.push(`"${(await decodeInput(inputBlock, '%', paramNames)).value}"`);
            } else {
                const inputBlock = await getBlock(input.block);
                const targetCode = await generateBlock(inputBlock);
                args.mutation.push(targetCode);
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

function hash (s) {
  return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}

async function decodeInput (inputBlock, name, paramNames) {
    switch (inputBlock.opcode) {
    // function
    case 'argument_reporter_boolean':
    case 'argument_reporter_string_number': {
        // follow the original logic of Scratch
        const index = paramNames ? paramNames.lastIndexOf(inputBlock.fields.VALUE.value) : 0;
        return new CompiledInput(
            `(params[${index}] || 0)`,
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
        const broadcastVariable = await lookupBroadcastMsg(broadcastOption.id, broadcastOption.value);
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
        if (this.constant) {
            switch (type) {
            case CompiledInput.TYPE_ALWAYS_NUMBER:
            case CompiledInput.TYPE_NUMBER:
                this.value = CompiledInput.toNumber(value);
                break;
            case CompiledInput.TYPE_BOOLEAN:
                this.value = CompiledInput.toBoolean(value);
                break;
            default:
                this.value = value;
            }
        } else {
            this.value = value;
        }
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
    
    // from src/util/cast.js
    static toNumber (value) {
        if (typeof value === 'number') {
            if (Number.isNaN(value)) return 0;
            return value;
        }
        const n = Number(value);
        if (Number.isNaN(n)) return 0;
        return n;
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
