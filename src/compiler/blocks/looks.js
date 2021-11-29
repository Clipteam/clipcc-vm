/**
 * 此类用于存放需要被生成的模块代码。
 */
const GeneratorType = require('../generator-type.js');

class Looks {
    static getProcessor () {
        return {
            looks_show: () => 'util.target.setVisible(true);\nblockClass.scratch3_looks._renderBubble(util.target);',
            looks_hide: () => 'util.target.setVisible(false);\nblockClass.scratch3_looks._renderBubble(util.target);',
            looks_changeeffectby: (parameters) => {
                const EFFECT = GeneratorType.asString(parameters.EFFECT).toLowerCase();
                const CHANGE = GeneratorType.asNum(parameters.CHANGE);
                return `util.target.setEffect(${EFFECT}, util.target.effects[${EFFECT}] + ${CHANGE})`;
            },
            looks_seteffectto: (parameters) => {
                const EFFECT = GeneratorType.asString(parameters.EFFECT).toLowerCase();
                const VALUE = GeneratorType.asNum(parameters.VALUE);
                return `util.target.setEffect(${EFFECT}, ${VALUE})`;
            },
            looks_cleargraphiceffects: () => 'util.target.clearEffects();',
            looks_changesizeby: (parameters) => {
                const CHANGE = GeneratorType.asNum(parameters.CHANGE);
                return `util.target.setSize(util.target.size + ${CHANGE});`;
            },
            looks_setsizeto: (parameters) => {
                const SIZE = GeneratorType.asNum(parameters.SIZE);
                return `util.target.setSize(${SIZE});`;
            },
            looks_gotofrontback: (parameters, isStage) => {
                if (isStage) return '';
                const FRONT_BACK = GeneratorType.asString(parameters.FRONT_BACK);
                if (parameters.FRONT_BACK == 'front') return 'util.target.goToFront();';
                else return 'util.target.goToBack();';
            },
            looks_goforwardbackwardlayers: (parameters, isStage) => {
                if (isStage) return '';
                const FORWARD_BACKWARD = GeneratorType.asString(parameters.FORWARD_BACKWARD);
                const NUM = GeneratorType.asNum(parameters.NUM);
                if (parameters.FORWARD_BACKWARD == 'forward') return `util.target.goForwardLayers(${NUM});`;
                else return `util.target.goBackwardLayers(${NUM});`;
            }
        };
    }
}
 
module.exports = Looks;
