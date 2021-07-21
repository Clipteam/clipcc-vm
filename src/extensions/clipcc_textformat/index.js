const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');
const {blockIconURI, menuIconURI} = require('./icons');

const axios = require('axios').default;

class TextFormat {
    constructor(runtime) {
        this.runtime = runtime;
    }

    getInfo() {
        return {
            id: "textformat",
            name: formatMessage({
                id: "textformat.categoryName",
                default: "TextFormat",
                description: "Libra Redlist Plugin"
            }),
            color1: '#E86948',
            blocks: [
            {
                opcode: 'text2ascii',
                text: formatMessage({
                    id: 'textformat.text2ascii',
                    default: 'convert [TEXT] to ASCII',
                    description: 'text2ascii'
                }),
                blockType: BlockType.REPORTER,
                arguments: {
                    TEXT: {
                        type: ArgumentType.STRING,
                        defaultValue: "C"
                    }
                }
            },
            {
                opcode: 'ascii2text',
                text: formatMessage({
                    id: 'textformat.ascii2text',
                    default: 'convert [ASCII] to text',
                    description: 'ascii2text'
                }),
                blockType: BlockType.REPORTER,
                arguments: {
                    ASCII: {
                        type: ArgumentType.NUMBER,
                        defaultValue: 97
                    }
                }
            },
            {
                opcode: 'text2unicode',
                text: formatMessage({
                    id: 'textformat.text2unicode',
                    default: 'convert [TEXT] to Unicode',
                    description: 'text2unicode'
                }),
                blockType: BlockType.REPORTER,
                arguments: {
                    TEXT: {
                        type: ArgumentType.STRING,
                        defaultValue: "草"
                    }
                }
            },
            {
                opcode: 'unicode2text',
                text: formatMessage({
                    id: 'textformat.unicode2text',
                    default: 'convert [UNICODE] to text',
                    description: 'unicode2text'
                }),
                blockType: BlockType.REPORTER,
                arguments: {
                    UNICODE: {
                        type: ArgumentType.NUMBER,
                        defaultValue: 33609
                    }
                }
            },
            {
                opcode: 'sha1',
                text: formatMessage({
                    id: 'textformat.sha1',
                    default: 'encrypt [TEXT] by SHA1',
                    description: 'sha1'
                }),
                blockType: BlockType.REPORTER,
                arguments: {
                    TEXT: {
                        type: ArgumentType.STRING,
                        defaultValue: "ClipCC yyds"
                    }
                }
            },
            {
                opcode: 'sha256',
                text: formatMessage({
                    id: 'textformat.sha256',
                    default: 'encrypt [TEXT] by SHA256',
                    description: 'sha256'
                }),
                blockType: BlockType.REPORTER,
                arguments: {
                    TEXT: {
                        type: ArgumentType.STRING,
                        defaultValue: "ClipCC yyds"
                    }
                }
            },
            {
                opcode: 'md5',
                text: formatMessage({
                    id: 'textformat.md5',
                    default: 'genetate the md5 of [TEXT]',
                    description: 'md5'
                }),
                blockType: BlockType.REPORTER,
                arguments: {
                    TEXT: {
                        type: ArgumentType.STRING,
                        defaultValue: "ClipCC yyds"
                    }
                }
            },
            {
                opcode: 'upper',
                text: formatMessage({
                    id: 'textformat.upper',
                    default: 'upper [TEXT]',
                    description: 'upper'
                }),
                blockType: BlockType.REPORTER,
                arguments: {
                    TEXT: {
                        type: ArgumentType.STRING,
                        defaultValue: "ClipCC yyds"
                    }
                }
            },
            {
                opcode: 'lower',
                text: formatMessage({
                    id: 'textformat.lower',
                    default: 'lower [TEXT]',
                    description: 'lower'
                }),
                blockType: BlockType.REPORTER,
                arguments: {
                    TEXT: {
                        type: ArgumentType.STRING,
                        defaultValue: "ClipCC yyds"
                    }
                }
            },
            {
                opcode: 'reverse',
                text: formatMessage({
                    id: 'textformat.reverse',
                    default: 'reverse [TEXT]',
                    description: 'reverse'
                }),
                blockType: BlockType.REPORTER,
                arguments: {
                    TEXT: {
                        type: ArgumentType.STRING,
                        defaultValue: "ClipCC yyds"
                    }
                }
            },
            {
                opcode: 'indexOf',
                text: formatMessage({
                    id: 'textformat.indeof',
                    default: '[POS] position of [TEXT] contain [MATCH]',
                    description: 'upper'
                }),
                blockType: BlockType.REPORTER,
                arguments: {
                    POS: {
                        type: ArgumentType.NUMBER,
                        defaultValue: 1
                    },
                    TEXT: {
                        type: ArgumentType.STRING,
                        defaultValue: "ClipCC yyds"
                    },
                    MATCH: {
                        type: ArgumentType.STRING,
                        defaultValue: "yyds"
                    }
                }
            },
            ]
        }
    }
    
    
}
module.exports = TextFormat;
