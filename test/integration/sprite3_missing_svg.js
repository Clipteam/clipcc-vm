/**
 * This test ensures that the VM gracefully handles a sprite3 file with
 * a missing vector costume. The VM should handle this safely by displaying
 * a Gray Question Mark, but keeping track of the original costume data
 * and serializing the original costume data back out. The saved project.json
 * should not reflect that the costume is broken and should therefore re-attempt
 * to load the costume if the saved project is re-loaded.
 */
const path = require('path');
const tap = require('tap');
const makeTestStorage = require('../fixtures/make-test-storage');
const FakeRenderer = require('../fixtures/fake-renderer');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');
const {serializeCostumes} = require('../../src/serialization/serialize-assets');

// The particular project that we're loading doesn't matter for this test
const projectUri = path.resolve(__dirname, '../fixtures/default.sb3');
const project = readFileToBuffer(projectUri);

const spriteUri = path.resolve(__dirname, '../fixtures/missing_svg.sprite3');
const sprite = readFileToBuffer(spriteUri);

const missingCostumeAssetId = 'a267f8b97ee9cf8aa9832aa0b4cfd9eb';

let vm;

tap.beforeEach(() => {
    const storage = makeTestStorage();

    vm = new VirtualMachine();
    vm.attachStorage(storage);
    vm.attachRenderer(new FakeRenderer());

    return vm.loadProject(project).then(() => vm.addSprite(sprite));
});

const test = tap.test;

test('loading sprite3 with missing vector costume file', t => {
    t.equal(vm.runtime.targets.length, 3);

    const stage = vm.runtime.targets[0];
    t.ok(stage.isStage);

    const blueGuySprite = vm.runtime.targets[2];
    t.equal(blueGuySprite.getName(), 'Blue Square Guy');
    t.equal(blueGuySprite.getCostumes().length, 1);

    const missingCostume = blueGuySprite.getCostumes()[0];
    t.equal(missingCostume.name, 'costume1');
    // Costume should have both default cosutme (e.g. Gray Question Mark) data and original data
    const defaultVectorAssetId = vm.runtime.storage.defaultAssetId.ImageVector;
    t.equal(missingCostume.assetId, defaultVectorAssetId);
    t.equal(missingCostume.dataFormat, 'svg');
    // Runtime should have info about broken asset
    t.ok(missingCostume.broken);
    t.equal(missingCostume.broken.assetId, missingCostumeAssetId);

    t.end();
});

test('load and then save sprite3 with missing vector costume file', t => {
    const resavedSprite = JSON.parse(vm.toJSON(vm.runtime.targets[2].id));

    t.equal(resavedSprite.name, 'Blue Square Guy');
    t.equal(resavedSprite.costumes.length, 1);

    const missingCostume = resavedSprite.costumes[0];
    t.equal(missingCostume.name, 'costume1');
    // Costume should have both default cosutme (e.g. Gray Question Mark) data and original data
    t.equal(missingCostume.assetId, missingCostumeAssetId);
    t.equal(missingCostume.dataFormat, 'svg');
    // Test that we didn't save any data about the costume being broken
    t.notOk(missingCostume.broken);

    t.end();
});

test('serializeCostume does not save data for missing costume', t => {
    const costumeDescs = serializeCostumes(vm.runtime, vm.runtime.targets[2].id);

    t.equal(costumeDescs.length, 0);

    t.end();
});
