/**
 * @fileoverview
 * Convert block stack to generator function.
 */
const WebWorker = require('web-worker');
const GeneratorFunction = Object.getPrototypeOf(function*(){}).constructor;
const workerScript = require('./compiler-worker');

class Compiler {
    constructor (runtime) {
        this.runtime = runtime;
        this.waitingToCompile = [];
        this.workers = [];
        this._initialized = false;
        window.compileWorkers = this.workers;
    }
    
    /**
     * create compile workers.
     */
    initialize (num) {
        if (this._initialized) return;
        for (let i = 0; i < num; i++) {
            this.createWorker(i);
        }
        this._initialized = true;
    }
    
    /**
     * create compile worker, and listen it.
     * @param {number} workerId
     */
    createWorker (workerId) {
        console.log('create worker ' + workerId);
        // create worker from string
        const scriptBlob = new Blob([workerScript], {type: "text/javascript"});
        let objectUrl = URL.createObjectURL(scriptBlob);
        if (typeof window === 'undefined') {
            objectUrl = 'src/engine/compiler-worker';
        }
        const worker = new WebWorker(objectUrl);
        // listen it
        worker.onmessage = ({data}) => {
            const { operation, content } = data;
            switch (operation) {
            // triggerred when worker cannot find blocks in its blockContainer.
            // worker will get new blocks by this.
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
            // ------ interacting with thread ------
            // @todo use rpcCall to replace them?
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
            // ------------
            // triggerred when code had been generated.
            case 'generated': {
                try {
                    for (const taskId in this.waitingToCompile) {
                        const task = this.waitingToCompile[taskId];
                        
                        if (task.id === content.entry) {
                            const blockCache = task.thread.blockContainer._cache;
                            
                            // insert dependencies to code
                            let insertedCode = `const { packageInstances } = util.runtime\n` + content.code;
                            for (const dependency of content.dependencies) {
                                insertedCode += '\n' + blockCache.compiledProcedures[dependency].artifact;
                            }
                            
                            console.log(`[Worker ${content.id} -> Main] ` + 'the final code is \n' + insertedCode);
                            // store artifact in block cache and target thread.
                            const func = eval(`'use strict';\n(function scoped(){return function*(util, params){${insertedCode}}})()`);
                            blockCache.compiledScripts[content.entry] = {
                                status: 'success',
                                artifact: func
                            };
                            task.thread.compiledArtifact = func;
                            // delete task
                            this.waitingToCompile.splice(taskId, 1);
                            break;
                        }
                    }
                } catch (e) {
                    console.error('cannot create function from code', e);
                }
                
                // release worker then perform the next task.
                this.workers[content.id].available = true;
                if (this.waitingToCompile.length > 0) this.check();
                
                break;
            }
            // triggerred when procedures had been generated.
            case 'procedure': {
                console.log(`[Worker ${content.id} -> Main] ` + 'the final procedure is \n' + content.code);
                try {
                    for (const taskId in this.waitingToCompile) {
                        const task = this.waitingToCompile[taskId];
                        
                        if (task.id === content.entry) {
                            const blockCache = task.thread.blockContainer._cache;
                            // For procedures, we just store code to be inserted by main script.
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
            // triggered when error occurred in worker
            case 'error': {
                console.error(`[Worker ${content.id} -> Main] ` + 'error occurred while generating\n', content.error);
                this.workers[content.id].available = true;
                
                for (const taskId in this.waitingToCompile) {
                    const task = this.waitingToCompile[taskId];
                        
                    if (task.id === content.entry) {
                        // cannot generate code for block stack, disable compiler for it.
                        const blockCache = task.thread.blockContainer._cache;
                        task.thread.disableCompiler = true;
                        blockCache.compiledScripts[content.entry] = {
                            status: 'error'
                        };
                        this.waitingToCompile.splice(taskId, 1);
                        break;
                    }
                }
                
                if (this.waitingToCompile.length > 0) this.check();
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
        // finally, initialze it.
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
    
    /**
     * just wanna compile a thread.
     * @param {Thread} thread
     */
    submitTask (thread) {
        const blockCache = thread.blockContainer._cache;
        
        // use cache by default
        if (blockCache.compiledScripts.hasOwnProperty(thread.topBlock)) {
            const cache = blockCache.compiledScripts[thread.topBlock];
            if (cache.status === 'success') {
                thread.compiledArtifact = cache.artifact;
            } else {
                // disable compiler when cache is corrupted.
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
    
    /**
     * try compile every thread.
     */
    check () {
        for (const task of this.waitingToCompile) {
            if (task.status !== 'pending') continue;
            this.checkForTask(task);
        }
    }
    
    /**
     * Find idle workers and start compiling
     * @param {object} task
     */
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
                    workerId: workerUnitId,
                    blocks: task.thread.blockContainer._blocks,
                    topBlockId: task.thread.topBlock
                }
            });
            workerUnit.available = false;
            task.status = 'working';
            return;
        }
    }
    
    /**
     * destroy all workers
     */
    dispose () {
        for (const workerId in this.workers) {
            const { worker } = this.workers[workerId];
            worker.terminate();
            delete this.workers[workerId];
        }
    }
}

module.exports = Compiler;