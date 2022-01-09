/**
 * 此类用于存放需要被生成的模块代码
 */
 
 class Procedure {
    static getProcessor () {
        return {
            procedures_call: (parameters) => {
                const {id, isGlobal, isWarp, isReturn} = parameters.procedureInfo;
                const procedureRequest = JSON.stringify({id, isGlobal, isWarp, isReturn});
                return `yield  ${procedureRequest};`
            }
        };
    }
}
 
module.exports = Procedure;
