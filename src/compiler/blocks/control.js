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
            control_if:
                'if (#<CONDITION>#) {\n' +
                '#<SUBSTACK>#\n' +
                '}',
            control_if_else:
                'if (#<CONDITION>#) {\n' +
                '#<SUBSTACK>#\n' +
                '} else {\n' +
                '#<SUBSTACK2>#\n' +
                '}'
        }
    }
}
 
module.exports = Control;