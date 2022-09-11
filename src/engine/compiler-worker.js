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
        const { blocks, topBlockId } = content;
        entryBlock = topBlockId;
        blockContainer = blocks;
        varCount = 0;
        dependencies = new Set();
        // For worker, interacting with main thread should use promise.
        generateStack(topBlockId, false)
            .then((snippet) => {
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
        return `packageInstances['scratch3_data']._getVariable(${id.asString()}, ${name.asString()}, util)`;
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
        return `packageInstances['scratch3_data']._getListContents(${id.asString()}, ${name.asString()}, util)`;
    }
    case 'data_addtolist': {
        const { id, name } = args.LIST;
        return `packageInstances['scratch3_data']._addToList(${id.asString()}, ${name.asString()}, ${args.ITEM.asString()}, util)`;
    }
    case 'data_deleteoflist': {
        const { id, name } = args.LIST;
        return `packageInstances['scratch3_data']._deleteOfList(${id.asString()}, ${name.asString()}, ${args.INDEX.asNumber()}, util)`;
    }
    case 'data_deletealloflist': {
        const { id, name } = args.LIST;
        return `packageInstances['scratch3_data']._deleteAllOfList(${id.asString()}, ${name.asString()}, util)`;
    }
    case 'data_insertatlist': {
        const { id, name } = args.LIST;
        return `packageInstances['scratch3_data']._insertAtList(${id.asString()}, ${name.asString()}, ${args.ITEM.asString()}, ${args.INDEX.asNumber()}, util)`;
    }
    case 'data_replaceitemoflist': {
        const { id, name } = args.LIST;
        return `packageInstances['scratch3_data']._replaceItemOfList(${id.asString()}, ${name.asString()}, ${args.ITEM.asString()}, ${args.INDEX.asNumber()}, util)`;
    }
    case 'data_itemoflist': {
        const { id, name } = args.LIST;
        return `packageInstances['scratch3_data']._getItemOfList(${id.asString()}, ${name.asString()}, ${args.INDEX.asNumber()}, util)`;
    }
    case 'data_itemnumoflist': {
        const { id, name } = args.LIST;
        return `packageInstances['scratch3_data']._getItemNumOfList(${id.asString()}, ${name.asString()}, ${args.INDEX.asNumber()}, util)`;
    }
    case 'data_lengthoflist': {
        const { id, name } = args.LIST;
        return `packageInstances['scratch3_data']._lengthOfList(${id.asString()}, ${name.asString()}, util)`;
    }
    case 'data_listcontainsitem': {
        const { id, name } = args.LIST;
        return `packageInstances['scratch3_data']._listContainsItem(${id.asString()}, ${name.asString()}, ${args.ITEM.asString()}, util)`;
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
                const targetCode = await generateBlock(input.block);
                args.mutation.push(`"" +(${targetCode})`);
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

function hash (inputString) {
    var hc="0123456789abcdef";
    function rh(n) {var j,s="";for(j=0;j<=3;j++) s+=hc.charAt((n>>(j*8+4))&0x0F)+hc.charAt((n>>(j*8))&0x0F);return s;}
    function ad(x,y) {var l=(x&0xFFFF)+(y&0xFFFF);var m=(x>>16)+(y>>16)+(l>>16);return (m<<16)|(l&0xFFFF);}
    function rl(n,c)            {return (n<<c)|(n>>>(32-c));}
    function cm(q,a,b,x,s,t)    {return ad(rl(ad(ad(a,q),ad(x,t)),s),b);}
    function ff(a,b,c,d,x,s,t)  {return cm((b&c)|((~b)&d),a,b,x,s,t);}
    function gg(a,b,c,d,x,s,t)  {return cm((b&d)|(c&(~d)),a,b,x,s,t);}
    function hh(a,b,c,d,x,s,t)  {return cm(b^c^d,a,b,x,s,t);}
    function ii(a,b,c,d,x,s,t)  {return cm(c^(b|(~d)),a,b,x,s,t);}
    function sb(x) {
        var i;var nblk=((x.length+8)>>6)+1;var blks=new Array(nblk*16);for(i=0;i<nblk*16;i++) blks[i]=0;
        for(i=0;i<x.length;i++) blks[i>>2]|=x.charCodeAt(i)<<((i%4)*8);
        blks[i>>2]|=0x80<<((i%4)*8);blks[nblk*16-2]=x.length*8;return blks;
    }
    var i,x=sb(inputString),a=1732584193,b=-271733879,c=-1732584194,d=271733878,olda,oldb,oldc,oldd;
    for(i=0;i<x.length;i+=16) {olda=a;oldb=b;oldc=c;oldd=d;
        a=ff(a,b,c,d,x[i+ 0], 7, -680876936);d=ff(d,a,b,c,x[i+ 1],12, -389564586);c=ff(c,d,a,b,x[i+ 2],17,  606105819);
        b=ff(b,c,d,a,x[i+ 3],22,-1044525330);a=ff(a,b,c,d,x[i+ 4], 7, -176418897);d=ff(d,a,b,c,x[i+ 5],12, 1200080426);
        c=ff(c,d,a,b,x[i+ 6],17,-1473231341);b=ff(b,c,d,a,x[i+ 7],22,  -45705983);a=ff(a,b,c,d,x[i+ 8], 7, 1770035416);
        d=ff(d,a,b,c,x[i+ 9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,     -42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);
        a=ff(a,b,c,d,x[i+12], 7, 1804603682);d=ff(d,a,b,c,x[i+13],12,  -40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);
        b=ff(b,c,d,a,x[i+15],22, 1236535329);a=gg(a,b,c,d,x[i+ 1], 5, -165796510);d=gg(d,a,b,c,x[i+ 6], 9,-1069501632);
        c=gg(c,d,a,b,x[i+11],14,  643717713);b=gg(b,c,d,a,x[i+ 0],20, -373897302);a=gg(a,b,c,d,x[i+ 5], 5, -701558691);
        d=gg(d,a,b,c,x[i+10], 9,   38016083);c=gg(c,d,a,b,x[i+15],14, -660478335);b=gg(b,c,d,a,x[i+ 4],20, -405537848);
        a=gg(a,b,c,d,x[i+ 9], 5,  568446438);d=gg(d,a,b,c,x[i+14], 9,-1019803690);c=gg(c,d,a,b,x[i+ 3],14, -187363961);
        b=gg(b,c,d,a,x[i+ 8],20, 1163531501);a=gg(a,b,c,d,x[i+13], 5,-1444681467);d=gg(d,a,b,c,x[i+ 2], 9,  -51403784);
        c=gg(c,d,a,b,x[i+ 7],14, 1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);a=hh(a,b,c,d,x[i+ 5], 4,    -378558);
        d=hh(d,a,b,c,x[i+ 8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16, 1839030562);b=hh(b,c,d,a,x[i+14],23,  -35309556);
        a=hh(a,b,c,d,x[i+ 1], 4,-1530992060);d=hh(d,a,b,c,x[i+ 4],11, 1272893353);c=hh(c,d,a,b,x[i+ 7],16, -155497632);
        b=hh(b,c,d,a,x[i+10],23,-1094730640);a=hh(a,b,c,d,x[i+13], 4,  681279174);d=hh(d,a,b,c,x[i+ 0],11, -358537222);
        c=hh(c,d,a,b,x[i+ 3],16, -722521979);b=hh(b,c,d,a,x[i+ 6],23,   76029189);a=hh(a,b,c,d,x[i+ 9], 4, -640364487);
        d=hh(d,a,b,c,x[i+12],11, -421815835);c=hh(c,d,a,b,x[i+15],16,  530742520);b=hh(b,c,d,a,x[i+ 2],23, -995338651);
        a=ii(a,b,c,d,x[i+ 0], 6, -198630844);d=ii(d,a,b,c,x[i+ 7],10, 1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);
        b=ii(b,c,d,a,x[i+ 5],21,  -57434055);a=ii(a,b,c,d,x[i+12], 6, 1700485571);d=ii(d,a,b,c,x[i+ 3],10,-1894986606);
        c=ii(c,d,a,b,x[i+10],15,   -1051523);b=ii(b,c,d,a,x[i+ 1],21,-2054922799);a=ii(a,b,c,d,x[i+ 8], 6, 1873313359);
        d=ii(d,a,b,c,x[i+15],10,  -30611744);c=ii(c,d,a,b,x[i+ 6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21, 1309151649);
        a=ii(a,b,c,d,x[i+ 4], 6, -145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+ 2],15,  718787259);
        b=ii(b,c,d,a,x[i+ 9],21, -343485551);a=ad(a,olda);b=ad(b,oldb);c=ad(c,oldc);d=ad(d,oldd);
    }
    return rh(a)+rh(b)+rh(c)+rh(d);
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
    case 'motion_goto_menu': {
        return new CompiledInput(
            inputBlock.fields.TO.value,
            CompiledInput.TYPE_STRING,
            true
        );
    }
    case 'motion_pointtowards_menu': {
        return new CompiledInput(
            inputBlock.fields.TOWARDS.value,
            CompiledInput.TYPE_STRING,
            true
        );
    }
    case 'looks_costume': {
        return new CompiledInput(
            inputBlock.fields.COSTUME.value,
            CompiledInput.TYPE_STRING,
            true
        );
    }
    case 'sensing_of_object_menu': {
        return new CompiledInput(
            inputBlock.fields.OBJECT.value,
            CompiledInput.TYPE_STRING,
            true
        );
    }
    case 'sensing_keyoptions': {
        return new CompiledInput(
            inputBlock.fields.KEY_OPTION.value,
            CompiledInput.TYPE_STRING,
            true
        );
    }
    case 'sensing_mouseoptions': {
        return new CompiledInput(
            inputBlock.fields.MOUSE_OPTION.value,
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
        try {
            /*
            // edge case: It's a unknown menu...?
            // inspired by Turbowarp, although I have not encountered this situation
            if (inputBlock.opcode !== 'data_variable' && inputBlock.opcode !== 'data_listcontents') {
                const inputs = Object.keys(inputBlock.inputs);
                const fields = Object.keys(inputBlock.fields);
                if (inputs.length === 0 && fields.length === 1) {
                    return new CompiledInput(
                        inputBlock.fields[fields[0]].value,
                        CompiledInput.TYPE_STRING,
                        true
                    );
                }
            }
            */
            
            // For most cases, this is a nested input.
            const result = await generateBlock(inputBlock.id);
            return new CompiledInput(
                result,
                CompiledInput.TYPE_DYNAMIC,
                false
            );
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
        if (this.constant) return Cast.toBoolean(this.value).asString();
        // Scratch 3 is more complicated for boolean type conversion
        // Processed it during runtime in the case of non-constant
        return `util.toBoolean(${this.value})`;
    }
}
}

module.exports = `(${workerFunc.toString()})()`;
