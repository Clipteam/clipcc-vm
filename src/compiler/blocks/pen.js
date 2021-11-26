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
            pen_drawRect: 'blockClass.extension_pen.drawRect({COLOR: \'#<COLOR>#\', X: Cast.toNumber(#<X>#), Y: Cast.toNumber(#<Y>#), WIDTH: Cast.toNumber(#<WIDTH>#), HEIGHT: Cast.toNumber(#<HEIGHT>#)}, util);',
            pen_penDown: 'blockClass.extension_pen.penDown({}, util);',
            pen_penUp: 'blockClass.extension_pen.penUp({}, util);',
            pen_stamp: 'blockClass.extension_pen.stamp({}, util);',
            pen_setPenColorToColor: 'blockClass.extension_pen.setPenColorToColor({COLOR: \'#<COLOR>#\'}, util)',
            pen_changePenColorParamBy: 'blockClass.extension_pen.changePenColorParamBy({COLOR_PARAM: \'#<COLOR_PARAM>#\', VALUE: Cast.toNumber(#<VALUE>#)}, util);',
            pen_setPenColorParamTo: 'blockClass.extension_pen.changePenColorParamTo({COLOR_PARAM: \'#<COLOR_PARAM>#\', VALUE: Cast.toNumber(#<VALUE>#)}, util);',
            pen_changePenSizeBy: 'blockClass.extension_pen.changePenSizeBy({SIZE: Cast.toNumber(#<SIZE>#)})',
            pen_changePenSizeTo: 'blockClass.extension_pen.changePenSizeTo({SIZE: Cast.toNumber(#<SIZE>#)})',
            pen_setPenShadeToNumber: 'blockClass.extension_pen.setPenShadeToNumber({SHADE: Cast.toNumber(#<SHADE>#)})',
            pen_changePenShadeBy: 'blockClass.extension_pen.changePenShadeBy({SHADE: Cast.toNumber(#<SHADE>#)})',
            pen_setPenHueToNumber: 'blockClass.extension_pen.setPenHueToNumber({HUE: Cast.toNumber(#<HUE>#)})',
            pen_changePenHueBy: 'blockClass.extension_pen.changePenHueBy({HUE: Cast.toNumber(#<HUE>#)})'
        };
    }
}
 
module.exports = Pen;
