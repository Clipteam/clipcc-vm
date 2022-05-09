/* eslint-disable no-console */
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const formatMessage = require('format-message');


/**
 * Enum for true/false.
 * @readonly
 * @enum {string}
 */
const BooleanParam = {
    TRUE: true,
    FALSE: false
};

/**
 * Enum for flash graphics.
 * @readonly
 * @enum {string}
 */
const FlashGraphicParam = {
    BEVEL: 'bevel',
    BLUR: 'blur',
    SHADOW: 'shadow',
    GLOW: 'glow'
};

class ClipBlocks {
    constructor (runtime) {
        this.runtime = runtime;
    }

    getInfo () {
        return {
            id: 'clipblocks',
            name: 'Clip Blocks',
            color1: '#4C97FF',
            // menuIconURI: menuIconURI,
            // blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: 'createVariable',
                    text: formatMessage({
                        id: 'clipblocks.createvar',
                        default: 'create a variable [NAME]',
                        description: 'create a variable'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'clipccno1'
                        }
                    }
                },
                {
                    opcode: 'deleteVariable',
                    text: formatMessage({
                        id: 'clipblocks.deletevar',
                        default: 'delete a variable [NAME]',
                        description: 'delete a variable'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'clipccno1'
                        }
                    }
                },
                {
                    opcode: 'isVariableExist',
                    text: formatMessage({
                        id: 'clipblocks.isVariableExist',
                        default: 'is [NAME] exist?',
                        description: 'is the variable exist?'
                    }),
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'clipccno1'
                        }
                    }
                },
                {
                    opcode: 'valueOfVariable',
                    text: formatMessage({
                        id: 'clipblocks.valueOfVariable',
                        default: 'value of [NAME]',
                        description: 'value of variable'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: 'clipccno1'
                        }
                    }
                },
                {
                    opcode: 'setVisibility',
                    text: formatMessage({
                        id: 'clipblocks.setVisibility',
                        default: 'set the visibility of all sprite to [BOOLEANMENU]',
                        description: 'hide all sprite'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        BOOLEANMENU: {
                            type: ArgumentType.STRING,
                            menu: 'booleanParam',
                            defaultValue: BooleanParam.FALSE
                        }
                    }
                },
                {
                    opcode: 'showDialog',
                    text: formatMessage({
                        id: 'clipblocks.showDialog',
                        // eslint-disable-next-line max-len
                        default: 'show dialog title:[TITLE] content: [CONTENT] left-layout: [BOOLEANMENU] buttontext:[BUTTONTEXT] ',
                        description: 'show dialog'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        TITLE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'FBI WARNING'
                        },
                        CONTENT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'A quick brown fox jumps over the lazy dog!!'
                        },
                        BOOLEANMENU: {
                            type: ArgumentType.STRING,
                            menu: 'booleanParam',
                            defaultValue: BooleanParam.FALSE
                        },
                        BUTTONTEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'OMG'
                        }
                    }
                },
                {
                    opcode: 'colorInPosition',
                    text: formatMessage({
                        id: 'clipblocks.colorInPosition',
                        default: 'color of x:[X] y:[Y]',
                        description: 'color in position'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'setStageSize',
                    text: formatMessage({
                        id: 'clipblocks.setStageSize',
                        default: 'set stage size to [WIDTH] x [HEIGHT]',
                        description: 'set stage size'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        WIDTH: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 480
                        },
                        HEIGHT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 360
                        }
                    }
                },
                {
                    opcode: 'setRate',
                    text: formatMessage({
                        id: 'clipblocks.setRate',
                        default: 'set rate to [RATE]',
                        description: 'set rate'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        RATE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 30
                        }
                    }
                },
                {
                    opcode: 'setFlashGraphicEffect',
                    text: formatMessage({
                        id: 'clipblocks.setFlashGraphicEffect',
                        default: 'set [FLASHEFFECT] flash effect to [VALUE1] [VALUE2] [VALUE3]',
                        description: 'set flash graphic effect'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        FLASHEFFECT: {
                            type: ArgumentType.STRING,
                            menu: 'flashGraphicParam',
                            defaultValue: FlashGraphicParam.BLUR
                        },
                        VALUE1: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 5
                        },
                        VALUE2: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 5
                        },
                        VALUE3: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 5
                        }
                    }
                },
                {
                    opcode: 'clearFlashGraphicEffect',
                    text: formatMessage({
                        id: 'clipblocks.clearFlashGraphicEffect',
                        default: 'clear all flash effect',
                        description: 'clear all flash effect'
                    }),
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'setClipboard',
                    text: formatMessage({
                        id: 'clipblocks.setClipboard',
                        default: 'set the content of clipboard to [TEXT]',
                        description: 'set clipboard'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'A quick brown fox jumps over the lazy dog.'
                        }
                    }
                },
                {
                    opcode: 'getClipboard',
                    text: formatMessage({
                        id: 'clipblocks.getClipboard',
                        default: 'content of clipboard',
                        description: 'get clipboard'
                    }),
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'playSoundFromInternet',
                    text: formatMessage({
                        id: 'clipblocks.playSoundFromInternet',
                        default: 'play sound from URL: [URL]',
                        description: 'set clipboard'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        URL: {
                            type: ArgumentType.STRING,
                            defaultValue: 'https://example.music.site/Brain Power.mp3'
                        }
                    }
                },
                {
                    opcode: 'stopSoundFromInternet',
                    text: formatMessage({
                        id: 'clipblocks.stopSoundFromInternet',
                        default: 'stop sound from URL',
                        description: 'set clipboard'
                    }),
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'gotoWebsite',
                    text: formatMessage({
                        id: 'clipblocks.gotoWebsite',
                        default: 'go to website: [URL]',
                        description: 'go to website'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        URL: {
                            type: ArgumentType.STRING,
                            defaultValue: 'https://cc3.codingclip.com/'
                        }
                    }
                }
            ],
            menus: {
                booleanParam: {
                    acceptReporters: true,
                    items: this.getBooleanParamItem()
                },
                flashGraphicParam: {
                    acceptReporters: true,
                    items: this.getFlashGraphicParamItem()
                }
            }
        };
    }

    createVariable (){
        // editingTarget.createVariable(1,"NMSL",Variable.BROADCAST_MESSAGE_TYPE);
    }
    deleteVariable (){
        return;
    }
    isVariableExist (){
        return false;
    }
    valueOfVariable (){
        return 114514;
    }

    setVisibility (args, utils){
        const targets = utils.runtime.targets;
        // console.log(targets);
        targets.forEach(target => {
            if (!target.isStage){
                // console.log(target);
                // console.log("修改前：", target.visible);
                target.setVisible(Cast.toBoolean(args.BOOLEANMENU));
                // console.log("修改后：", target.visible);
            }
        });
        
    }

    showDialog (){
        return;
    }
    colorInPosition (){
        return 16777215;
    }
    setStageSize (){
        return;
    }
    setRate (){
        return;
    }
    setFlashGraphicEffect (){
        return;
    }
    clearFlashGraphicEffect (){
        return;
    }

    async setClipboard (args){
        /* 该方法用于http协议下使用
        const input = document.createElement('INPUT');
        input.style.opacity  = 0;
        input.style.position = 'absolute';
        input.style.left = '-100000px';
        document.body.appendChild(input);
        // 创建一个不可见的input

        input.value = args.TEXT;
        input.select();
        input.setSelectionRange(0, args.TEXT.length);
        document.execCommand('copy');
        document.body.removeChild(input);
        //自动选中复制销毁
        */
        if (!navigator.clipboard) return; // 不支持该操作
        navigator.clipboard.writeText(args.TEXT);
    }

    async getClipboard (){
        if (!navigator.clipboard) return ''; // 不支持该操作
        // eslint-disable-next-line radix
        if (this.getBroswer().broswer == 'FireFox' && parseInt(this.getBroswer().version) < 91) {
            console.log('Unsupported firefox version!');
            return;
        }// Firefox不支持
        const permissionStatus = await navigator.permissions.query({name: 'clipboard-read'});
        if (permissionStatus.state != 'granted') return ''; // 未授权
        return await navigator.clipboard.readText();
    }

    getBroswer (){
        const Sys = {};
        const ua = navigator.userAgent.toLowerCase();
        let s;
        (s = ua.match(/rv:([\d.]+)\) like gecko/)) ? Sys.ie = s[1] :
            (s = ua.match(/msie ([\d\.]+)/)) ? Sys.ie = s[1] :
                (s = ua.match(/edge\/([\d\.]+)/)) ? Sys.edge = s[1] :
                    (s = ua.match(/firefox\/([\d\.]+)/)) ? Sys.firefox = s[1] :
                        (s = ua.match(/(?:opera|opr).([\d\.]+)/)) ? Sys.opera = s[1] :
                            (s = ua.match(/chrome\/([\d\.]+)/)) ? Sys.chrome = s[1] :
                                (s = ua.match(/version\/([\d\.]+).*safari/)) ? Sys.safari = s[1] : 0;
        // 根据关系进行判断
        if (Sys.ie) return {broswer: 'IE', version: Sys.ie};
        if (Sys.edge) return {broswer: 'Edge', version: Sys.edge};
        if (Sys.firefox) return {broswer: 'FireFox', version: Sys.firefox};
        if (Sys.chrome) return {broswer: 'Chrome', version: Sys.chrome};
        if (Sys.opera) return {broswer: 'Opera', version: Sys.opera};
        if (Sys.safari) return {broswer: 'Safari', version: Sys.safari};
        return 'Unkonwn';
    }

    playSoundFromInternet (args, utils){
        utils.target.audio = new Audio(args.URL);
        console.log(utils.target.audio);
        utils.target.audio.play();
    }

    stopSoundFromInternet (utils){
        const audio = utils.target.audio;
        audio.pause();
        audio.currentTime = 0;
    }

    gotoWebsite (args){
        document.open(args.URL, 'website', null, false);
    }

    getBooleanParamItem () {
        return [
            {
                text: formatMessage({
                    id: 'clipblocks.booleanMenu.true',
                    default: 'true',
                    description: 'label for true'
                }),
                value: BooleanParam.TRUE
            },
            {
                text: formatMessage({
                    id: 'clipblocks.booleanMenu.false',
                    default: 'false',
                    description: 'label for false'
                }),
                value: BooleanParam.FALSE
            }
        ];
    }

    getFlashGraphicParamItem () {
        return [
            {
                text: formatMessage({
                    id: 'clipblocks.graphicMenu.bevel',
                    default: 'bevel',
                    description: 'label for bevel'
                }),
                value: FlashGraphicParam.BEVEL
            },
            {
                text: formatMessage({
                    id: 'clipblocks.graphicMenu.blur',
                    default: 'blur',
                    description: 'label for blur'
                }),
                value: FlashGraphicParam.BLUR
            },
            {
                text: formatMessage({
                    id: 'clipblocks.graphicMenu.glow',
                    default: 'glow',
                    description: 'label for glow'
                }),
                value: FlashGraphicParam.GLOW
            },
            {
                text: formatMessage({
                    id: 'clipblocks.graphicMenu.shadow',
                    default: 'shadow',
                    description: 'label for shadow'
                }),
                value: FlashGraphicParam.SHADOW
            }
        ];
    }
}

module.exports = ClipBlocks;
