/**
 * 此类用于存放需要被生成的模块代码。
 */
const GeneratorType = require('../generator-type.js');

class Motion {
    static getProcessor () {
        return {
            motion_movesteps: (parameters) => {
                const STEPS = GeneratorType.asNum(parameters.STEPS);
                return `util.target.setXY(util.target.x + ${STEPS} * Math.cos(MathUtil.degToRad(90 - util.target.direction)), util.target.y + ${STEPS} * Math.sin(MathUtil.degToRad(90 - util.target.direction)));`;
                
            },
            motion_gotoxy: (parameters) => {
                const X = GeneratorType.asNum(parameters.X);
                const Y = GeneratorType.asNum(parameters.Y);
                return `util.target.setXY(${X}, ${Y});`;
            },
            motion_goto: (parameters) => {
                const TO = GeneratorType.asString(parameters.TO);
                return `if (blockClass.scratch3_motion.getTargetXY(${TO}, util)) util.target.setXY(blockClass.scratch3_motion.getTargetXY(${TO}, util)[0], blockClass.scratch3_motion.getTargetXY(${TO}, util)[1]);`;
            },
            motion_pointtowards: (parameters) => {
                const TOWARDS = GeneratorType.asString(parameters.TOWARDS);
                return `blockClass.scratch3_motion.pointTowards({TOWARDS: ${TOWARDS}}, util)`;
            },
            motion_turnright: (parameters) => {
                const DEGREES = GeneratorType.asNum(parameters.DEGREES);
                return `util.target.setDirection(util.target.direction + ${DEGREES});`;
            },
            motion_turnleft: (parameters) => {
                const DEGREES = GeneratorType.asNum(parameters.DEGREES);
                return `util.target.setDirection(util.target.direction - ${DEGREES});`;
            },
            motion_pointindirection: (parameters) => {
                const DIRECTION = GeneratorType.asNum(parameters.DIRECTION);
                return `util.target.setDirection(${DIRECTION});`;
            },
            motion_ifonedgebounce: () =>'blockClass.scratch3_motion.ifOnEdgeBounce(null, util);',
            motion_setrotationstyle: (parameters) => {
                const STYLE = GeneratorType.asString(parameters.STYLE);
                return `util.target.setRotationStyle(${STYLE});`;
            },
            motion_changexby: (parameters) => {
                const DX = GeneratorType.asNum(parameters.DX);
                return `util.target.setXY(util.target.x + ${DX}, util.target.y);`;
            },
            motion_setx: (parameters) => {
                const X = GeneratorType.asNum(parameters.X);
                return `util.target.setXY(${X}, util.target.y);`;
            },
            motion_changeyby: (parameters) => {
                const DY = GeneratorType.asNum(parameters.DY);
                return `util.target.setXY(util.target.x, util.target.y + ${DY});`;
            },
            motion_sety: (parameters) => {
                const Y = GeneratorType.asNum(parameters.Y);
                return `util.target.setXY(util.target.x, ${Y});`;
            },
            motion_xposition: () => 'blockClass.scratch3_motion.limitPrecision(util.target.x)',
            motion_yposition: () => 'blockClass.scratch3_motion.limitPrecision(util.target.y)',
            motion_direction: () => 'util.target.direction',
            motion_scroll_right: () => '',
            motion_scroll_up: () => '',
            motion_align_scene: () => '',
            motion_xscroll: () => '',
            motion_yscroll: () => ''
            
        };
    }
}
 
module.exports = Motion;
