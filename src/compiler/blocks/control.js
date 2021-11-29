/**
 * 此类用于存放需要被生成的模块代码。
 */
const GeneratorType = require('../generator-type.js');

class Control {
    static getProcessor () {
        return {
            control_repeat: (parameters) => {
                const TIMES = GeneratorType.asNum(parameters.TIMES);
                const SUBSTACK = parameters.SUBSTACK;
                return `for(var i = 0; i<${TIMES}; i++){\n${SUBSTACK}\nyield;\n}`;
            },
            control_forever: (parameters) => {
                const SUBSTACK = parameters.SUBSTACK;
                return `while(true) {\n${SUBSTACK}\nyield;\n}`;
            },
            control_if: (parameters) => {
                const CONDITION = parameters.CONDITION;
                const SUBSTACK = parameters.SUBSTACK;
                return `if (${CONDITION}) {\n${SUBSTACK}\n}`;
            },
            control_if_else: (parameters) => {
                const CONDITION = parameters.CONDITION;
                const SUBSTACK = parameters.SUBSTACK;
                const SUBSTACK2 = parameters.SUBSTACK2;
                `if (${CONDITION}) {\n${SUBSTACK}\n} else {\n${SUBSTACK2}\n}`;
            }
        };
    }
}
 
module.exports = Control;
