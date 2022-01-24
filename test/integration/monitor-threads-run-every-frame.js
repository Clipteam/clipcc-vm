const path = require('path');
const test = require('tap').test;
const makeTestStorage = require('../fixtures/make-test-storage');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');
const Thread = require('../../src/engine/thread');
const Runtime = require('../../src/engine/runtime');

const projectUri = path.resolve(__dirname, '../fixtures/timer-monitor.sb3');
const project = readFileToBuffer(projectUri);

const checkMonitorThreadPresent = (t, threads) => {
    t.equal(threads.length, 1);
    const monitorThread = threads[0];
    t.equal(monitorThread.stackClick, false);
    t.equal(monitorThread.updateMonitor, true);
    t.equal(monitorThread.topBlock.toString(), 'timer');
};

/**
 * Creates a monitor and then checks if it gets run every frame.
 */
test('monitor thread runs every frame', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    t.doesNotThrow(() => {
        // Note: don't run vm.start(), we handle calling _step() manually in this test
        vm.runtime.currentStepTime = Runtime.THREAD_STEP_INTERVAL;
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);

        vm.loadProject(project).then(() => {
            t.equal(vm.runtime.threads.length, 0);

            vm.runtime._step();
            let doneThreads = vm.runtime._lastStepDoneThreads;
            t.equal(vm.runtime.threads.length, 0);
            t.equal(doneThreads.length, 1);
            checkMonitorThreadPresent(t, doneThreads);
            t.assert(doneThreads[0].status === Thread.STATUS_DONE);

            // Check that both are added again when another step is taken
            vm.runtime._step();
            doneThreads = vm.runtime._lastStepDoneThreads;
            t.equal(vm.runtime.threads.length, 0);
            t.equal(doneThreads.length, 1);
            checkMonitorThreadPresent(t, doneThreads);
            t.assert(doneThreads[0].status === Thread.STATUS_DONE);
            t.end();
        });
    });
});

/**
 * If the monitor doesn't finish evaluating within one frame, it shouldn't be added again
 * on the next frame. (We skip execution by setting the step time to 0)
 */
test('monitor thread not added twice', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    t.doesNotThrow(() => {
        // Note: don't run vm.start(), we handle calling _step() manually in this test
        vm.runtime.currentStepTime = 0;

        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);

        vm.loadProject(project).then(() => {
            t.equal(vm.runtime.threads.length, 0);

            vm.runtime._step();
            let doneThreads = vm.runtime._lastStepDoneThreads;
            t.equal(vm.runtime.threads.length, 1);
            t.equal(doneThreads.length, 0);
            checkMonitorThreadPresent(t, vm.runtime.threads);
            t.assert(vm.runtime.threads[0].status === Thread.STATUS_RUNNING);
            const prevThread = vm.runtime.threads[0];

            // Check that both are added again when another step is taken
            vm.runtime._step();
            doneThreads = vm.runtime._lastStepDoneThreads;
            t.equal(vm.runtime.threads.length, 1);
            t.equal(doneThreads.length, 0);
            checkMonitorThreadPresent(t, vm.runtime.threads);
            t.equal(vm.runtime.threads[0], prevThread);
            t.end();
        });
    });
});
