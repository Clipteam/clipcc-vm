/**
 * 此类用于存放需要被生成的模块代码
 */
const GeneratorType = require('../generator-type.js');

class Pen {
    static getProcessor () {
        return {
            pen_clear: () => 'blockClass.extension_pen.clear();',
            pen_setPrintFont:(parameters) => {
                const FONT = GeneratorType.asString(parameters.FONT);
                return `blockClass.extension_pen.setPrintFont({FONT: ${FONT}});`;
            },
            pen_setPrintFontSize: (parameters) => {
                const SIZE = GeneratorType.asNum(parameters.SIZE);
                return `blockClass.extension_pen.setPrintFontSize({SIZE: ${SIZE}});`;
            },
            pen_setPrintFontColor: (parameters) => {
                const COLOR = GeneratorType.asString(parameters.COLOR);
                return `blockClass.extension_pen.setPrintFontColor({COLOR: \'${COLOR}});`;
            },
            pen_printText: (parameters) => {
                const TEXT = GeneratorType.asString(parameters.TEXT);
                const X = GeneratorType.asNum(parameters.X);
                const Y = GeneratorType.asNum(parameters.Y);
                return `blockClass.extension_pen.printText({TEXT: ${TEXT}, X: ${X}, Y: ${Y}}, util);`;
            },
            pen_drawRect: (parameters) => {
                const COLOR = GeneratorType.asString(parameters.COLOR);
                const X = GeneratorType.asNum(parameters.X);
                const Y = GeneratorType.asNum(parameters.Y);
                const WIDTH = GeneratorType.asNum(parameters.WIDTH);
                const HEIGHT = GeneratorType.asNum(parameters.HEIGHT);
                return `blockClass.extension_pen.drawRect({COLOR: ${COLOR}, X: ${X}, Y: ${Y}, WIDTH: ${WIDTH}, HEIGHT: ${HEIGHT}}, util);`;
            },
            pen_penDown: () =>'blockClass.extension_pen.penDown({}, util);',
            pen_penUp: () => 'blockClass.extension_pen.penUp({}, util);',
            pen_stamp: () => 'blockClass.extension_pen.stamp({}, util);',
            pen_setPenColorToColor: (parameters) => {
                const COLOR = GeneratorType.asString(parameters.COLOR);
                return `blockClass.extension_pen.setPenColorToColor({COLOR: ${COLOR}}, util);`;
            },
            pen_changePenColorParamBy: (parameters) => {
                const VALUE = GeneratorType.asNum(parameters.VALUE);
                const COLOR_PARAM = parameters.COLOR_PARAM;
                return `blockClass.extension_pen.changePenColorParamBy({COLOR_PARAM: ${COLOR_PARAM}, VALUE: ${VALUE}}, util);`;
            },
            pen_setPenColorParamTo: (parameters) => {
                const VALUE = GeneratorType.asNum(parameters.VALUE);
                const COLOR_PARAM = parameters.COLOR_PARAM;
                return `blockClass.extension_pen.changePenColorParamTo({COLOR_PARAM: ${COLOR_PARAM}, VALUE: ${VALUE}}, util);`;
            },
            pen_changePenSizeBy: (parameters) => {
                const SIZE = GeneratorType.asNum(parameters.SIZE);
                return `blockClass.extension_pen.changePenSizeBy({SIZE: ${SIZE}});`;
            },
            pen_changePenSizeTo: (parameters) => {
                const SIZE = GeneratorType.asNum(parameters.SIZE);
                return `blockClass.extension_pen.changePenSizeTo({SIZE: ${SIZE}});`;
            },
            pen_setPenShadeToNumber: (parameters) => {
                const SHADE = GeneratorType.asNum(parameters.SHADE);
                return `blockClass.extension_pen.setPenShadeToNumber({SHADE: ${SHADE}});`;
            },
            pen_changePenShadeBy: (parameters) => {
                const SHADE = GeneratorType.asNum(parameters.SHADE);
                return `blockClass.extension_pen.setPenShadeBy({SHADE: ${SHADE}});`;
            },
            pen_setPenHueToNumber: (parameters) => {
                const HUE = GeneratorType.asNum(parameters.HUE);
                return `blockClass.extension_pen.setPenHueToNumber({HUE: ${HUE}});`;
            },
            pen_changePenHueBy: (parameters) => {
                const HUE = GeneratorType.asNum(parameters.HUE);
                return `blockClass.extension_pen.setPenHueBy({HUE: ${HUE}});`;
            }
        };
    }
}
 
module.exports = Pen;
