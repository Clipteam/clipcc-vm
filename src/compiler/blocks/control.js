/**
 * 此类用于存放需要被生成的模块代码。
 */
 
 class Control {
    static getCode () {
        return {
            control_repeat: 
                'for(var i = 0; i<#<TIMES>#; i++){\n' +
                '#<SUBSTACK>#\n' +
                '}',
            control_forever:
                'while(true) {\n' +
                '#<SUBSTACK>#\n' +
                '}',
        }
    }
}
 
module.exports = Control;