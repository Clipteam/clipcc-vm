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
        console.log('create worker' + workerId);
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
            case 'getBlock': {
                const result = this._getBlockInFlyout(content.id);
                worker.postMessage({
                    operation: 'resolvePromise',
                    content: {
                        type: 'getBlock',
                        id: content.id,
                        result
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
            case 'generated': {
                console.log(`[Worker ${content.id} -> Main] ` + 'the final code is \n' + content.code);
                try {
                    const func = eval(`'use strict';\n(function scoped(){return function*(){${content.code}}})()`);
                    console.log('the function is', func);
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
            case 'error': {
                console.log(`[Worker ${content.id} -> Main] ` + 'error occurred while generating\n', content.error);
                this.workers[content.id].available = true;
                if (this.waitingToCompile.length > 0) {
                    this.waitingToCompile.shift();
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
        const task = {
            id: thread.topBlock,
            status: 'pending',
            thread
        };
        this.waitingToCompile.push(task);
        this.checkForTask(this.waitingToCompile[this.waitingToCompile.length - 1]);
        
        console.log(this.waitingToCompile);
    }
    
    check () {
        for (const task of this.waitingToCompile) {
            if (task.status !== 'pending') continue;
            this.checkForTask(task);
        }
    }
    
    checkForTask (task) {
        console.log('check task', task);
        // Find available workers for the current task
        for (const workerUnitId in this.workers) {
            const workerUnit = this.workers[workerUnitId];
            if (!workerUnit.available) continue;
            console.log(`worker${workerUnitId} is available!`);
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