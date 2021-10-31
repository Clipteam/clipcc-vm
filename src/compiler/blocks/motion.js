/**
 * 此类用于存放需要被生成的模块代码。
 */
 
 class Motion {
     static getCode () {
         return {
             motion_movesteps: `
                const steps = Number(#[STEPS]#);
                const radians = MathUtil.degToRad(90 - util.target.direction);
                const dx = steps * Math.cos(radians);
                const dy = steps * Math.sin(radians);
                util.target.setXY(util.target.x + dx, util.target.y + dy);
            `,
            motion_gotoxy: `
                const x = Number(#[X]#);
                const y = Number(#[Y]#);
                util.target.setXY(x, y);
            `,
            motion_goto: `
                const getTargetXY = function (targetName, util) {
                    let targetX = 0;
                    let targetY = 0;
                    if (targetName === '_mouse_') {
                        targetX = util.ioQuery('mouse', 'getScratchX');
                        targetY = util.ioQuery('mouse', 'getScratchY');
                    } else if (targetName === '_random_') {
                        const stageWidth = this.runtime.constructor.STAGE_WIDTH;
                        const stageHeight = this.runtime.constructor.STAGE_HEIGHT;
                        targetX = Math.round(stageWidth * (Math.random() - 0.5));
                        targetY = Math.round(stageHeight * (Math.random() - 0.5));
                   } else {
                        targetName = Cast.toString(targetName);
                        const goToTarget = this.runtime.getSpriteTargetByName(targetName);
                        if (!goToTarget) return;
                        targetX = goToTarget.x;
                        targetY = goToTarget.y;
                    }
                    return [targetX, targetY];
                }
                const targetXY = getTargetXY(#[TO]#, util);
                if (targetXY) {
                    util.target.setXY(targetXY[0], targetXY[1]);
                }
            `,
            motion_turnright: `
                const degrees = Number(#[DEGREES]#);
                util.target.setDirection(util.target.direction + degrees);
            `,
            motion_turnleft: `
                const degrees = Number(#[DEGREES]#);
                util.target.setDirection(util.target.direction - degrees);
            `,
         }
     }
 }
 
module.exports = Motion;