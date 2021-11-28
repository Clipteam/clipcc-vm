/**
 * 此类用于存放需要被生成的模块代码。
 */
const GeneratorType = require('../generator-type.js');

class Operators {
    static getProcessor () {
        return {
            operator_add: (parameters) => {
                const NUM1 = parameters.NUM1;
                const NUM2 = parameters.NUM2;
                return `(${NUM1} + ${NUM2})`;
            },
            operator_subtract: (parameters) => {
                const NUM1 = parameters.NUM1;
                const NUM2 = parameters.NUM2;
                return `(${NUM1} - ${NUM2})`;
            },
            operator_multiply: (parameters) => {
                const NUM1 = parameters.NUM1;
                const NUM2 = parameters.NUM2;
                return `(${NUM1} * ${NUM2})`;
            },
            operator_divide: (parameters) => {
                const NUM1 = parameters.NUM1;
                const NUM2 = parameters.NUM2;
                return `(${NUM1} / ${NUM2})`;
            },
            operator_lt: 'Cast.compare(#<OPERAND1>#, #<OPERAND2>#) < 0',
            operator_equals: 'Cast.compare(#<OPERAND1>#, #<OPERAND2>#) == 0',
            operator_gt: 'Cast.compare(#<OPERAND1>#, #<OPERAND2>#) > 0',
            operator_and: '#<OPERAND1># && #<OPERAND2>#',
            operator_or: '#<OPERAND1># || #<OPERAND2>#',
            operator_not: '!#<OPERAND>#',
            operator_join: '#<STRING1># + #<STRING2>#'
        };
    }
}
 
module.exports = Operators;
