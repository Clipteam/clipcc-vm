/**
 * @fileoverview
 * An CC3 serializer and deserializer. Parses provided
 * JSON and then generates all needed clipcc-vm runtime structures.
 */

const vmPackage = require('../../package.json');
const sb3 = require('./sb3');

/**
 * Serializes the specified VM runtime.
 * @param {object} options Options for saving.
 * @param {!Runtime} runtime VM runtime instance to be serialized.
 * @param {string=} targetId Optional target id if serializing only a single target
 * @return {object} Serialized runtime instance.
 */
const serialize = function (options, runtime, targetId) {
    // Fetch targets
    const obj = Object.create(null);
    // Create extension set to hold extension ids found while serializing targets
    const extensions = new Set();

    const originalTargetsToSerialize = targetId ?
        [runtime.getTargetById(targetId)] :
        runtime.targets.filter(target => target.isOriginal);

    const layerOrdering = sb3.getSimplifiedLayerOrdering(originalTargetsToSerialize);

    const flattenedOriginalTargets = originalTargetsToSerialize.map(t => t.toJSON());

    // If the renderer is attached, and we're serializing a whole project (not a sprite)
    // add a temporary layerOrder property to each target.
    if (runtime.renderer && !targetId) {
        flattenedOriginalTargets.forEach((t, index) => {
            t.layerOrder = layerOrdering[index];
        });
    }

    const serializedTargets = flattenedOriginalTargets.map(t => sb3.serializeTarget(t, extensions));

    if (targetId) {
        return serializedTargets[0];
    }

    obj.targets = serializedTargets;

    obj.monitors = sb3.serializeMonitors(runtime.getMonitorState());

    // Assemble extension list
    obj.extensions = runtime.vm.ccExtensionManager.getLoadedExtensions(options.saveOptionalExtension);

    // Assemble metadata
    const meta = Object.create(null);
    meta.semver = '3.0.0';
    meta.editor = 'clipcc';
    meta.vm = vmPackage.version;
    if (runtime.origin) {
        meta.origin = runtime.origin;
    }
    
    // Store settings in meta
    if (runtime.storeSettings) {
        meta.settings = {
            frameRate: runtime.frameRate
        }
    }

    // Attach full user agent string to metadata if available
    meta.agent = 'none';
    if (typeof navigator !== 'undefined') meta.agent = navigator.userAgent;

    // Assemble payload and return
    obj.meta = meta;
    return obj;
};

/**
 * Deserialize the specified representation of a VM runtime and loads it into the provided runtime instance.
 * @param  {object} json - JSON representation of a VM runtime.
 * @param  {Runtime} runtime - Runtime instance
 * @param {JSZip} zip - Sb3 file describing this project (to load assets from)
 * @param {boolean} isSingleSprite - If true treat as single sprite, else treat as whole project
 * @returns {Promise.<ImportedProject>} Promise that resolves to the list of targets after the project is deserialized
 */
const deserialize = function (json, runtime, zip, isSingleSprite) {
    const extensions = {
        extensionIDs: new Set(),
        extensionURLs: new Map()
    };

    // Store the origin field (e.g. project originated at CSFirst) so that we can save it again.
    if (json.meta && json.meta.origin) {
        runtime.origin = json.meta.origin;
    } else {
        runtime.origin = null;
    }
    
    // load settings
    if (json.meta.settings) {
        const { settings } = json.meta;
        if (settings.frameRate)
            runtime.setFramerate(parseInt(settings.frameRate));
    }

    // First keep track of the current target order in the json,
    // then sort by the layer order property before parsing the targets
    // so that their corresponding render drawables can be created in
    // their layer order (e.g. back to front)
    const targetObjects = ((isSingleSprite ? [json] : json.targets) || [])
        .map((t, i) => Object.assign(t, {targetPaneOrder: i}))
        .sort((a, b) => a.layerOrder - b.layerOrder);

    const monitorObjects = json.monitors || [];

    return Promise.resolve(
        targetObjects.map(target =>
            sb3.parseScratchAssets(target, runtime, zip))
    )
        // Force this promise to wait for the next loop in the js tick. Let
        // storage have some time to send off asset requests.
        .then(assets => Promise.resolve(assets))
        .then(assets => Promise.all(targetObjects
            .map((target, index) =>
                sb3.parseScratchObject(target, runtime, extensions, zip, assets[index]))))
        .then(targets => targets // Re-sort targets back into original sprite-pane ordering
            .map((t, i) => {
                // Add layer order property to deserialized targets.
                // This property is used to initialize executable targets in
                // the correct order and is deleted in VM's installTargets function
                t.layerOrder = i;
                return t;
            })
            .sort((a, b) => a.targetPaneOrder - b.targetPaneOrder)
            .map(t => {
                // Delete the temporary properties used for
                // sprite pane ordering and stage layer ordering
                delete t.targetPaneOrder;
                return t;
            }))
        .then(targets => sb3.replaceUnsafeCharsInVariableIds(targets))
        .then(targets => {
            monitorObjects.map(monitorDesc => sb3.deserializeMonitor(monitorDesc, runtime, targets, extensions));
            return targets;
        })
        .then(targets => ({
            targets,
            extensions: json.extensions
        }));
};

module.exports = {
    serialize,
    deserialize
};
