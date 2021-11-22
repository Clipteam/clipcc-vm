/**
 * 此类用于存放需要被生成的模块代码
 */
 
class Pen {
    static getCode () {
        return {
            pen_clear: 'blockClass.extension_pen.clear();',
            pen_setPrintFont: 'blockClass.extension_pen.setPrintFont({FONT: \'#<FONT>#\'});',
            pen_setPrintFontSize: 'blockClass.extension_pen.setPrintFontSize({SIZE: Cast.toNumber(#<SIZE>#)});',
            pen_setPrintFontColor: 'blockClass.extension_pen.setPrintFontColor({COLOR: \'#<COLOR>#\'});',
            pen_printText: 'blockClass.extension_pen.printText({TEXT: \'#<TEXT>#\', X: Cast.toNumber(#<X>#), Y: Cast.toNumber(#<Y>#)}, util);',
            pen_penDown: 'blockClass.extension_pen.penDown({}, util);',
            pen_penUp: 'blockClass.extension_pen.penUp({}, util);',
            pen_stamp: 'blockClass.extension_pen.stamp({}, util);',
        };
    }
}
 
module.exports = Pen;
