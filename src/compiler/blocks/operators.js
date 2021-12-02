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
            operator_lt: (parameters) => {
                const OPERAND1 = parameters.OPERAND1;
                const OPERAND2 = parameters.OPERAND2;
                return `Cast.compare(${OPERAND1}, ${OPERAND2}) < 0`;
            },
            operator_equals: (parameters) => {
                const OPERAND1 = parameters.OPERAND1;
                const OPERAND2 = parameters.OPERAND2;
                return `Cast.compare(${OPERAND1}, ${OPERAND2}) == 0`;
            },
            operator_gt: (parameters) => {
                const OPERAND1 = parameters.OPERAND1;
                const OPERAND2 = parameters.OPERAND2;
                return `Cast.compare(${OPERAND1}, ${OPERAND2}) > 0`;
            },
            operator_and: (parameters) => {
                const OPERAND1 = parameters.OPERAND1;
                const OPERAND2 = parameters.OPERAND2;
                return `${OPERAND1} && ${OPERAND2}`;
            },
            operator_or: '#<OPERAND1># || #<OPERAND2>#',
            operator_not: '!#<OPERAND>#',
            operator_join: '#<STRING1># + #<STRING2>#'
        };
    }
}
 
module.exports = Operators;
