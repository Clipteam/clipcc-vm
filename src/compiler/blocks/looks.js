/**
 * 此类用于存放需要被生成的模块代码。
 */
 
 class Looks {
 	static getPrefix() {
        return '';
    }
     
    static getCode () {
        return {
            looks_show: 
                'util.target.setVisible(true);\n' ,
                //'this._renderBubble(util.target);',
            looks_hide: 
                'util.target.setVisible(false);\n' ,
                //'this._renderBubble(util.target);',
            looks_cleargraphiceffects: 'util.target.clearEffects();',
            looks_changesizeby: 'util.target.setSize(util.target.size + Number(#<CHANGE>#));',
            looks_setsizeto:'util.target.setSize(Number(#<SIZE>#));',
            looks_gotofrontback: 
                'if (util.isStage) return;' +
                'if (#<FRONT_BACK># === \'front\') util.target.goToFront();' +
                'else util.target.goToBack();',
            looks_goforwardbackwardlayers: 
                'if (util.isStage) return;' +
                'if (#<FORWARD_BACKWARD># === \'forward\') util.target.goForwardLayers(Number(#<NUM>#));' +
                'else util.target.goBackwardLayers(Cast.toNumber(#<NUM>#));',
        }
    }
}
 
module.exports = Looks;