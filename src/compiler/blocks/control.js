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
            control_forever:
                'while(true) {\n' +
                '#<SUBSTACK>#\n' +
                'yield;\n' +
                '}',
            control_if:
                'if (#<CONDITION>#) {\n' +
                '#<SUBSTACK>#\n' +
                '}',
            control_if_else:
                'if (#<CONDITION>#) {\n' +
                '#<SUBSTACK>#\n' +
                '} else {\n' +
                '#<SUBSTACK2>#\n' +
                '}',
            control_wait: 'if(!timer) var timer;\n' +
                'timer = new Timer();\n' +
                'timer.start();\n' +
                'while (timer.timeElapsed() <= Cast.toNumber(#<DURATION>#) * 1000) yield;'
        };
    }
}
 
module.exports = Control;
