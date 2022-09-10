const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;
const workerScript = require('./compiler-worker');

class Compiler {
    constructor (runtime) {
        this.runtime = runtime;
        this.waitingToCompile = [];
        this.workers = [];
        this.initialize();
    }
    
    initialize () {
        for (let i = 0; i < 4; i++) {
            this.createWorker(i);
        }
    }
    
    createWorker (workerId) {
        // Create worker
        if (!window.Worker) {
            console.error('Browser does not support Worker.');
            return;
        }
        const scriptBlob = new Blob([workerScript], {type: "text/javascript"});
        const worker = new Worker(window.URL.createObjectURL(scriptBlob));
        worker.onmessage = ({data}) => {
            const { operation, content } = data;
            switch (operation) {
            case 'getBlocks': {
                let thread;
                for (const task of this.waitingToCompile) {
                    if (task.id === content.entry) {
                        thread = task.thread;
                        break;
                    }
                }
                
                worker.postMessage({
                    operation: 'resolvePromise',
                    content: {
                        type: 'getBlocks',
                        id: content.entry,
                        result: thread.blockContainer._blocks
                    }
                });
                break;
            }
            case 'isHat': {
                const result = this.runtime.getIsHat(content.opcode);
                worker.postMessage({
                    operation: 'resolvePromise',
                    content: {
                        type: 'isHat',
                        id: content.id,
                        result
                    }
                });
                break;
            }
            case 'lookupBroadcastMsg': {
                let thread;
                for (const task of this.waitingToCompile) {
                    if (task.id === content.entry) {
                        thread = task.thread;
                        break;
                    }
                }
                const result = thread.target.lookupBroadcastMsg(content.id, content.value);
                worker.postMessage({
                    operation: 'resolvePromise',
                    content: {
                        type: 'lookupBroadcastMsg',
                        id: content.id,
                        result
                    }
                });
                break;
            }
            case 'getProcedureParamNamesIdsAndDefaults': {
                let thread;
                for (const task of this.waitingToCompile) {
                    if (task.id === content.entry) {
                        thread = task.thread;
                        break;
                    }
                }
                const result = thread.target.blocks.getProcedureParamNamesIdsAndDefaults(content.id);
                worker.postMessage({
                    operation: 'resolvePromise',
                    content: {
                        type: 'getProcedureParamNamesIdsAndDefaults',
                        id: content.id,
                        result
                    }
                });
                break;
            }
            case 'getProcedureDefinition': {
                let thread;
                for (const task of this.waitingToCompile) {
                    if (task.id === content.entry) {
                        thread = task.thread;
                        break;
                    }
                }
                const result = thread.target.blocks.getProcedureDefinition(content.id);
                worker.postMessage({
                    operation: 'resolvePromise',
                    content: {
                        type: 'getProcedureDefinition',
                        id: content.id,
                        result
                    }
                });
                break;
            }
            case 'generated': {
                try {
                    //console.log('the function is', func);
                    
                    for (const taskId in this.waitingToCompile) {
                        const task = this.waitingToCompile[taskId];
                        
                        if (task.id === content.entry) {
                            const blockCache = task.thread.blockContainer._cache;
                            
                            let insertedCode = content.code;
                            for (const dependency of content.dependencies) {
                                insertedCode += '\n' + blockCache.compiledProcedures[dependency].artifact;
                            }
                            
                            console.log(`[Worker ${content.id} -> Main] ` + 'the final code is \n' + insertedCode);
                            const func = eval(`'use strict';\n(function scoped(){return function*(util, params){${insertedCode}}})()`);
                            blockCache.compiledScripts[content.entry] = {
                                status: 'success',
                                artifact: func
                            };
                            task.thread.compiledArtifact = func;
                            this.waitingToCompile.splice(taskId, 1);
                            break;
                        }
                    }
                } catch (e) {
                    console.error('cannot create function from code', e);
                }
                
                this.workers[content.id].available = true;
                
                if (this.waitingToCompile.length > 0) {
                    // perform the next task
                    this.check();
                }
                
                break;
            }
            case 'procedure': {
                console.log(`[Worker ${content.id} -> Main] ` + 'the final procedure is \n' + content.code);
                try {
                    for (const taskId in this.waitingToCompile) {
                        const task = this.waitingToCompile[taskId];
                        
                        if (task.id === content.entry) {
                            const blockCache = task.thread.blockContainer._cache;
                            // console.log(task, blockCache)
                            blockCache.compiledProcedures[content.name] = {
                                status: 'success',
                                artifact: `function * f${content.name} (util, params) {\n${content.code}\n}\n`
                            };
                            break;
                        }
                    }
                } catch (e) {
                    console.error('cannot create procedure', e);
                }
                
                break;
            }
            case 'error': {
                console.error(`[Worker ${content.id} -> Main] ` + 'error occurred while generating\n', content.error);
                this.workers[content.id].available = true;
                
                for (const taskId in this.waitingToCompile) {
                    const task = this.waitingToCompile[taskId];
                        
                    if (task.id === content.entry) {
                        const blockCache = task.thread.blockContainer._cache;
                        blockCache.compiledScripts[content.entry] = {
                            status: 'error'
                        };
                        this.waitingToCompile.splice(taskId, 1);
                        break;
                    }
                }
                
                if (this.waitingToCompile.length > 0) {
                    // perform the next task
                    this.check();
                }
                break;
            }
            default: 
                console.error('Unknown message', data);
            }
        };
        worker.onerror = (e) => {
            console.error('Error occurred in worker: ', e);
            // this.worker.terminate();
        }
        worker.unhandledrejection = (e) => {
            console.error('Error occurred in worker: ', e);
            // this.worker.terminate();
        }
        worker.onmessageerror = (e) => {
            console.error('Error occurred while serializing postData: ', e);
        }
        worker.postMessage({
            operation: 'initialize',
            content: {
                id: workerId
            }
        });
        this.workers.push({
            worker,
            available: true
        });
    }
    
    submitTask (thread) {
        const blockCache = thread.blockContainer._cache;
        
        if (blockCache.compiledScripts.hasOwnProperty(thread.topBlock)) {
            const cache = blockCache.compiledScripts[thread.topBlock];
            if (cache.status === 'success') {
                // console.log('use cache', cache);
                thread.compiledArtifact = cache.artifact;
            } else {
                // console.log('disable compiler');
                thread.disableCompiler = true;
            }
            return;
        }
        const task = {
            id: thread.topBlock,
            status: 'pending',
            thread
        };
        this.waitingToCompile.push(task);
        this.checkForTask(this.waitingToCompile[this.waitingToCompile.length - 1]);
        
        // console.log(this.waitingToCompile);
    }
    
    check () {
        for (const task of this.waitingToCompile) {
            if (task.status !== 'pending') continue;
            this.checkForTask(task);
        }
    }
    
    checkForTask (task) {
        // console.log('check task', task);
        // Find available workers for the current task
        for (const workerUnitId in this.workers) {
            const workerUnit = this.workers[workerUnitId];
            if (!workerUnit.available) continue;
            // console.log(`worker${workerUnitId} is available!`);
            workerUnit.worker.postMessage({
                operation: 'start',
                content: {
                    blocks: task.thread.blockContainer._blocks,
                    topBlockId: task.thread.topBlock
                }
            });
            workerUnit.available = false;
            task.status = 'working';
            return;
        }
    }
    
    _getBlockInFlyout (id) {
        return this.runtime.flyoutBlocks._blocks[id];
    }
    
    dispose () {
        for (const workerId in this.workers) {
            const { worker } = this.workers[workerId];
            worker.terminate();
            delete this.workers[workerId];
        }
    }
}

module.exports = Compiler;