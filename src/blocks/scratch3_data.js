/* eslint-disable max-len */
const Cast = require('../util/cast');
const Variable = require('../engine/variable');

class Scratch3DataBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            data_variable: this.getVariable,
            data_setvariableto: this.setVariableTo,
            data_changevariableby: this.changeVariableBy,
            data_hidevariable: this.hideVariable,
            data_showvariable: this.showVariable,
            data_listcontents: this.getListContents,
            data_addtolist: this.addToList,
            data_deleteoflist: this.deleteOfList,
            data_deletealloflist: this.deleteAllOfList,
            data_insertatlist: this.insertAtList,
            data_replaceitemoflist: this.replaceItemOfList,
            data_itemoflist: this.getItemOfList,
            data_itemnumoflist: this.getItemNumOfList,
            data_lengthoflist: this.lengthOfList,
            data_listcontainsitem: this.listContainsItem,
            data_hidelist: this.hideList,
            data_showlist: this.showList
        };
    }

    getCompiledFragment () {
        return {
            data_variable: this._getVariable,
            data_setvariableto: this._setVariableTo,
            data_changevariableby: this._changeVariableBy,
            data_showvariable: this._showVariable,
            data_hidevariable: this._hideVariable,
            data_listcontents: this._getListContents,
            data_addtolist: this._addToList,
            data_deleteoflist: this._deleteOfList,
            data_deletealloflist: this._deleteAllOfList,
            data_insertatlist: this._insertAtList,
            data_replaceitemoflist: this._replaceItemOfList,
            data_itemoflist: this._getItemOfList,
            data_itemnumoflist: this._getItemNumOfList,
            data_lengthoflist: this._lengthOfList,
            data_listcontainsitem: this._listContainsItem,
            data_hidelist: this._hideList,
            data_showlist: this._showList
        };
    }

    // 变量引用在生成阶段即可确定
    _getVariableRef (args, thread) {
        const target = thread.target;
        const stage = thread.runtime.getTargetForStage();
        let referTo = args.VARIABLE ? args.VARIABLE.raw() : args.LIST.raw();

        // 直接从 id 获取
        if (target.variables.hasOwnProperty(referTo)) {
            return `util.target.variables['${referTo}']`;
        }
        if (!target.isStage) {
            if (stage && stage.variables.hasOwnProperty(referTo)) {
                return `util.runtime.getTargetForStage().variables['${referTo}']`;
            }
        }

        // 根据名字遍历获取, 通常发生在获取链表引用中
        for (const varId in target.variables) {
            if (target.variables.hasOwnProperty(varId)) {
                const currVar = target.variables[varId];
                if (currVar.name === referTo) {
                    return `util.target.variables['${currVar.id}']`;
                }
            }
        }

        if (!target.isStage && stage) {
            for (const varId in stage.variables) {
                if (stage.variables.hasOwnProperty(varId)) {
                    const currVar = stage.variables[varId];
                    if (currVar.name === referTo) {
                        return `util.runtime.getTargetForStage().variables['${currVar.id}']`;
                    }
                }
            }
        }
    }

    _getVariable (args, isWarp, varPool, thread) {
        return `${this._getVariableRef(args, thread)}.value`;
    }

    getVariable (args, util) {
        const variable = util.target.lookupOrCreateVariable(
            args.VARIABLE.id, args.VARIABLE.name);
        return variable.value;
    }

    _setVariableTo (args, isWarp, varPool, thread) {
        return `${this._getVariable(args, isWarp, varPool, thread)} = ${args.VALUE.asString()}\n` +
        `if (${this._getVariableRef(args, thread)}.isCloud) util.ioQuery('cloud', 'requestUpdateVariable', [${this._getVariableRef(args, thread)}.name, ${args.VALUE.asString()}])`;
    }

    setVariableTo (args, util) {
        const variable = util.target.lookupOrCreateVariable(
            args.VARIABLE.id, args.VARIABLE.name);
        variable.value = args.VALUE;

        if (variable.isCloud) {
            util.ioQuery('cloud', 'requestUpdateVariable', [variable.name, args.VALUE]);
        }
    }

    _changeVariableBy (args, isWarp, varPool, thread) {
        return `${this._getVariable(args, isWarp, varPool, thread)} = +(${this._getVariable(args, isWarp, varPool, thread)}) + ${args.VALUE.asNumber()}\n` +
        `if (${this._getVariableRef(args, thread)}.isCloud) util.ioQuery('cloud', 'requestUpdateVariable', [${this._getVariableRef(args, thread)}.name, ${args.VALUE.asString()}])`;
    }

    changeVariableBy (args, util) {
        const variable = util.target.lookupOrCreateVariable(
            args.VARIABLE.id, args.VARIABLE.name);
        const castedValue = Cast.toNumber(variable.value);
        const dValue = Cast.toNumber(args.VALUE);
        const newValue = castedValue + dValue;
        variable.value = newValue;

        if (variable.isCloud) {
            util.ioQuery('cloud', 'requestUpdateVariable', [variable.name, newValue]);
        }
    }

    changeMonitorVisibility (id, visible) {
        // Send the monitor blocks an event like the flyout checkbox event.
        // This both updates the monitor state and changes the isMonitored block flag.
        this.runtime.monitorBlocks.changeBlock({
            id: id, // Monitor blocks for variables are the variable ID.
            element: 'checkbox', // Mimic checkbox event from flyout.
            value: visible
        }, this.runtime);
    }

    _showVariable (args, isWarp, varPool, thread) {
        return `util.runtime.monitorBlocks.changeBlock({ id: ${this._getVariableRef(args, thread)}.id, element: "checkbox", value: true }, util.runtime)`;
    }

    showVariable (args) {
        this.changeMonitorVisibility(args.VARIABLE.id, true);
    }

    _hideVariable (args, isWarp, varPool, thread) {
        return `util.runtime.monitorBlocks.changeBlock({ id: ${this._getVariableRef(args, thread)}.id, element: "checkbox", value: false }, util.runtime)`;
    }

    hideVariable (args) {
        this.changeMonitorVisibility(args.VARIABLE.id, false);
    }

    _showList (args, isWarp, varPool, thread) {
        return `util.runtime.monitorBlocks.changeBlock({ id: ${this._getVariableRef(args, thread)}.id, element: "checkbox", value: true }, util.runtime)`;
    }

    showList (args) {
        this.changeMonitorVisibility(args.LIST.id, true);
    }

    _hideList (args, isWarp, varPool, thread) {
        return `util.runtime.monitorBlocks.changeBlock({ id: ${this._getVariableRef(args, thread)}.id, element: "checkbox", value: false }, util.runtime)`;
    }

    hideList (args) {
        this.changeMonitorVisibility(args.LIST.id, false);
    }

    _getListContents (args, isWarp, varPool, thread) {
        return `listContents(${this._getVariableRef(args, thread)})`;
    }

    getListContents (args, util) {
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);

        // If block is running for monitors, return copy of list as an array if changed.
        if (util.thread.updateMonitor) {
            // Return original list value if up-to-date, which doesn't trigger monitor update.
            if (list._monitorUpToDate) return list.value;
            // If value changed, reset the flag and return a copy to trigger monitor update.
            // Because monitors use Immutable data structures, only new objects trigger updates.
            list._monitorUpToDate = true;
            return list.value.slice();
        }

        // Determine if the list is all single letters.
        // If it is, report contents joined together with no separator.
        // If it's not, report contents joined together with a space.
        let allSingleLetters = true;
        for (let i = 0; i < list.value.length; i++) {
            const listItem = list.value[i];
            if (!((typeof listItem === 'string') &&
                  (listItem.length === 1))) {
                allSingleLetters = false;
                break;
            }
        }
        if (allSingleLetters) {
            return list.value.join('');
        }
        return list.value.join(' ');

    }

    _addToList (args, isWarp, varPool, thread) {
        return `${this._getVariableRef(args, thread)}.value.push(${args.ITEM.asString()})\n` +
        `${this._getVariableRef(args, thread)}._monitorUpToDate = false`;
    }

    addToList (args, util) {
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        if (list.value.length < Scratch3DataBlocks.LIST_ITEM_LIMIT) {
            list.value.push(args.ITEM);
            list._monitorUpToDate = false;
        }
    }

    _deleteOfList (args, isWarp, varPool, thread) {
        return `listDelete(${this._getVariableRef(args, thread)}, ${args.INDEX.asNumber()})`;
    }

    deleteOfList (args, util) {
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        const index = Cast.toListIndex(args.INDEX, list.value.length, true);
        if (index === Cast.LIST_INVALID) {
            return;
        } else if (index === Cast.LIST_ALL) {
            list.value = [];
            return;
        }
        list.value.splice(index - 1, 1);
        list._monitorUpToDate = false;
    }

    _deleteAllOfList (args, isWarp, varPool, thread) {
        return `${this._getVariableRef(args, thread)}.value = []\n` +
        `${this._getVariableRef(args, thread)}._monitorUpToDate = false`;
    }

    deleteAllOfList (args, util) {
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        list.value = [];
        return;
    }

    _insertAtList (args, isWarp, varPool, thread) {
        return `listInsert(${this._getVariableRef(args, thread)}, ${args.INDEX.asNumber()}, ${args.ITEM.asString()})`;
    }

    insertAtList (args, util) {
        const item = args.ITEM;
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        const index = Cast.toListIndex(args.INDEX, list.value.length + 1, false);
        if (index === Cast.LIST_INVALID) {
            return;
        }
        const listLimit = Scratch3DataBlocks.LIST_ITEM_LIMIT;
        if (index > listLimit) return;
        list.value.splice(index - 1, 0, item);
        if (list.value.length > listLimit) {
            // If inserting caused the list to grow larger than the limit,
            // remove the last element in the list
            list.value.pop();
        }
        list._monitorUpToDate = false;
    }

    _replaceItemOfList (args, isWarp, varPool, thread) {
        return `listReplace(${this._getVariableRef(args, thread)}, ${args.INDEX.asNumber()}, ${args.ITEM.asString()})`;
    }

    replaceItemOfList (args, util) {
        const item = args.ITEM;
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        const index = Cast.toListIndex(args.INDEX, list.value.length, false);
        if (index === Cast.LIST_INVALID) {
            return;
        }
        list.value[index - 1] = item;
        list._monitorUpToDate = false;
    }

    _getItemOfList (args, isWarp, varPool, thread) {
        return `listGet(${this._getVariableRef(args, thread)}.value, ${args.INDEX.asNumber()})`;
    }

    getItemOfList (args, util) {
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        const index = Cast.toListIndex(args.INDEX, list.value.length, false);
        if (index === Cast.LIST_INVALID) {
            return '';
        }
        return list.value[index - 1];
    }

    _getItemNumOfList (args, isWarp, varPool, thread) {
        return `listIndexOf(${this._getVariableRef(args, thread)}, ${args.ITEM.asString()})`;
    }

    getItemNumOfList (args, util) {
        const item = args.ITEM;
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);

        // Go through the list items one-by-one using Cast.compare. This is for
        // cases like checking if 123 is contained in a list [4, 7, '123'] --
        // Scratch considers 123 and '123' to be equal.
        for (let i = 0; i < list.value.length; i++) {
            if (Cast.compare(list.value[i], item) === 0) {
                return i + 1;
            }
        }

        // We don't bother using .indexOf() at all, because it would end up with
        // edge cases such as the index of '123' in [4, 7, 123, '123', 9].
        // If we use indexOf(), this block would return 4 instead of 3, because
        // indexOf() sees the first occurence of the string 123 as the fourth
        // item in the list. With Scratch, this would be confusing -- after all,
        // '123' and 123 look the same, so one would expect the block to say
        // that the first occurrence of '123' (or 123) to be the third item.

        // Default to 0 if there's no match. Since Scratch lists are 1-indexed,
        // we don't have to worry about this conflicting with the "this item is
        // the first value" number (in JS that is 0, but in Scratch it's 1).
        return 0;
    }

    _lengthOfList (args, isWarp, varPool, thread) {
        return `${this._getVariableRef(args, thread)}.value.length`;
    }

    lengthOfList (args, util) {
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        return list.value.length;
    }

    _listContainsItem (args, isWarp, varPool, thread) {
        return `listContains(${this._getVariableRef(args, thread)}, ${args.ITEM.asString()})`;
    }

    listContainsItem (args, util) {
        const item = args.ITEM;
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        if (list.value.indexOf(item) >= 0) {
            return true;
        }
        // Try using Scratch comparison operator on each item.
        // (Scratch considers the string '123' equal to the number 123).
        for (let i = 0; i < list.value.length; i++) {
            if (Cast.compare(list.value[i], item) === 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * Type representation for list variables.
     * @const {string}
     */
    static get LIST_ITEM_LIMIT () {
        return 2147483647;
    }
}

module.exports = Scratch3DataBlocks;
