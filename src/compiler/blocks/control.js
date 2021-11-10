/**
 * 此类用于存放需要被生成的模块代码。
 */
 
 class Control {
    static getPrefix() {
        return '';
    }
     
    static getCode () {
        return {
            control_repeat: 
                'for(var i = 0; i<#<TIMES>#; i++){\n' +
                '#<SUBSTACK>#\n' +
                'yield;\n' +
                '}',
            control_forever:
                'while(true) {\n' +
                '#<SUBSTACK>#\n' +
                'yield;\n' +
                '}',
        }
    }
}
 
module.exports = Control;