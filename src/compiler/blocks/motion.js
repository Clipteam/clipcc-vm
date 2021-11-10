/**
 * 此类用于存放需要被生成的模块代码。
 */

 class Motion {
    static getPrefix() {
        return `const getTargetXY = function (targetName, util) {
            let targetX = 0;
            let targetY = 0;
            if (targetName === '_mouse_') {
                targetX = util.ioQuery('mouse', 'getScratchX');
                targetY = util.ioQuery('mouse', 'getScratchY');
            } else if (targetName === '_random_') {
                const stageWidth = util.runtime.constructor.STAGE_WIDTH;
                const stageHeight = util.runtime.constructor.STAGE_HEIGHT;
                targetX = Math.round(stageWidth * (Math.random() - 0.5));
                targetY = Math.round(stageHeight * (Math.random() - 0.5));
            } else {
                targetName = String(targetName);
                const goToTarget = util.runtime.getSpriteTargetByName(targetName);
                if (!goToTarget) return;
                targetX = goToTarget.x;
                targetY = goToTarget.y;
            }
            return [targetX, targetY];
            }`;
    }
    
    static getCode () {
        return {
            motion_movesteps: 'util.target.setXY(util.target.x + Number(#<STEPS>#) * Math.cos(MathUtil.degToRad(90 - util.target.direction)), util.target.y + Number(#<STEPS>#) * Math.sin(MathUtil.degToRad(90 - util.target.direction)));',
            motion_gotoxy: 'util.target.setXY(#<X>#, #<Y>#);',
            motion_goto: 'if (getTargetXY(#[TO]#, util)) util.target.setXY(getTargetXY(#[TO]#, util)[0], getTargetXY(#[TO]#, util)[1]);',
            motion_turnright: 'util.target.setDirection(util.target.direction + Number(#<DEGREES>#));',
            motion_turnleft: 'util.target.setDirection(util.target.direction - Number(#<DEGREES>#));',
        }
    }
}
 
module.exports = Motion;