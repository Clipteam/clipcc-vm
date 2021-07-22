const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');
const {blockIconURI, menuIconURI} = require('./icons');

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
                    default: 'calculate SHA1 of [TEXT]',
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
                    default: 'calculate SHA256 of [TEXT]',
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
                    default: 'calculate MD5 of [TEXT]',
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

    text2unicode(args, util) {
        return args.TEXT.charCodeAt(0);
    }

    unicode2text(args, util) {
        let code = parseInt(args.UNICODE);
        return String.fromCharCode(code);
    }

    encodeUTF8(str) {
        var i, r = [], c, x;
        for (i = 0; i < str.length; i++)
          if ((c = str.charCodeAt(i)) < 0x80) r.push(c);
          else if (c < 0x800) r.push(0xC0 + (c >> 6 & 0x1F), 0x80 + (c & 0x3F));
          else {
            if ((x = c ^ 0xD800) >> 10 == 0) //对四字节UTF-16转换为Unicode
              c = (x << 10) + (str.charCodeAt(++i) ^ 0xDC00) + 0x10000,
                r.push(0xF0 + (c >> 18 & 0x7), 0x80 + (c >> 12 & 0x3F));
            else r.push(0xE0 + (c >> 12 & 0xF));
            r.push(0x80 + (c >> 6 & 0x3F), 0x80 + (c & 0x3F));
          };
        return r;
      }
      
      sha1(args, util) {
        var data = new Uint8Array(this.encodeUTF8(args.TEXT));
        var i, j, t;
        var l = ((data.length + 8) >>> 6 << 4) + 16, s = new Uint8Array(l << 2);
        s.set(new Uint8Array(data.buffer)), s = new Uint32Array(s.buffer);
        for (t = new DataView(s.buffer), i = 0; i < l; i++)s[i] = t.getUint32(i << 2);
        s[data.length >> 2] |= 0x80 << (24 - (data.length & 3) * 8);
        s[l - 1] = data.length << 3;
        var w = [], f = [
          function () { return m[1] & m[2] | ~m[1] & m[3]; },
          function () { return m[1] ^ m[2] ^ m[3]; },
          function () { return m[1] & m[2] | m[1] & m[3] | m[2] & m[3]; },
          function () { return m[1] ^ m[2] ^ m[3]; }
        ], rol = function (n, c) { return n << c | n >>> (32 - c); },
          k = [1518500249, 1859775393, -1894007588, -899497514],
          m = [1732584193, -271733879, null, null, -1009589776];
        m[2] = ~m[0], m[3] = ~m[1];
        for (i = 0; i < s.length; i += 16) {
          var o = m.slice(0);
          for (j = 0; j < 80; j++)
            w[j] = j < 16 ? s[i + j] : rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1),
              t = rol(m[0], 5) + f[j / 20 | 0]() + m[4] + w[j] + k[j / 20 | 0] | 0,
              m[1] = rol(m[1], 30), m.pop(), m.unshift(t);
          for (j = 0; j < 5; j++)m[j] = m[j] + o[j] | 0;
        };
        t = new DataView(new Uint32Array(m).buffer);
        for (var i = 0; i < 5; i++)m[i] = t.getUint32(i << 2);
      
        var hex = Array.prototype.map.call(new Uint8Array(new Uint32Array(m).buffer), function (e) {
          return (e < 16 ? "0" : "") + e.toString(16);
        }).join("");
        return hex;
      }
}
module.exports = TextFormat;
