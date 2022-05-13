/* eslint-disable no-mixed-operators */
/* eslint-disable func-style */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
const log = require('./log');

class StringUtil {
    static withoutTrailingDigits (s) {
        let i = s.length - 1;
        while ((i >= 0) && ('0123456789'.indexOf(s.charAt(i)) > -1)) i--;
        return s.slice(0, i + 1);
    }

    static unusedName (name, existingNames) {
        if (existingNames.indexOf(name) < 0) return name;
        name = StringUtil.withoutTrailingDigits(name);
        let i = 2;
        while (existingNames.indexOf(name + i) >= 0) i++;
        return name + i;
    }

    /**
     * Split a string on the first occurrence of a split character.
     * @param {string} text - the string to split.
     * @param {string} separator - split the text on this character.
     * @returns {string[]} - the two parts of the split string, or [text, null] if no split character found.
     * @example
     * // returns ['foo', 'tar.gz']
     * splitFirst('foo.tar.gz', '.');
     * @example
     * // returns ['foo', null]
     * splitFirst('foo', '.');
     * @example
     * // returns ['foo', '']
     * splitFirst('foo.', '.');
     */
    static splitFirst (text, separator) {
        const index = text.indexOf(separator);
        if (index >= 0) {
            return [text.substring(0, index), text.substring(index + 1)];
        }
        return [text, null];

    }

    /**
     * A customized version of JSON.stringify that sets Infinity/NaN to 0,
     * instead of the default (null).
     * Needed because null is not of type number, but Infinity/NaN are, which
     * can lead to serialization producing JSON that isn't valid based on the parser schema.
     * It is also consistent with the behavior of saving 2.0 projects.
     * This is only needed when stringifying an object for saving.
     *
     * @param {!object} obj - The object to serialize
     * @return {!string} The JSON.stringified string with Infinity/NaN replaced with 0
     */
    static stringify (obj) {
        return JSON.stringify(obj, (_key, value) => {
            if (typeof value === 'number' &&
               (value === Infinity || value === -Infinity || isNaN(value))){
                return 0;
            }
            return value;
        });
    }
    /**
     * A function to replace unsafe characters (not allowed in XML) with safe ones. This is used
     * in cases where we're replacing non-user facing strings (e.g. variable IDs).
     * When replacing user facing strings, the xmlEscape utility function should be used
     * instead so that the user facing string does not change how it displays.
     * @param {!string | !Array.<string>} unsafe Unsafe string possibly containing unicode control characters.
     * In some cases this argument may be an array (e.g. hacked inputs from 2.0)
     * @return {string} String with control characters replaced.
     */
    static replaceUnsafeChars (unsafe) {
        if (typeof unsafe !== 'string') {
            if (Array.isArray(unsafe)) {
                // This happens when we have hacked blocks from 2.0
                // See #1030
                unsafe = String(unsafe);
            } else {
                log.error('Unexpected input recieved in replaceUnsafeChars');
                return unsafe;
            }
        }
        return unsafe.replace(/[<>&'"]/g, c => {
            switch (c) {
            case '<': return 'lt';
            case '>': return 'gt';
            case '&': return 'amp';
            case '\'': return 'apos';
            case '"': return 'quot';
            }
        });
    }

    static md5 (inputString) {
        const hc = '0123456789abcdef';
        function rh (n) {
            let j; let s = ''; for (j = 0; j <= 3; j++) s += hc.charAt((n >> (j * 8 + 4)) & 0x0F) + hc.charAt((n >> (j * 8)) & 0x0F); return s;
        }
        function ad (x, y) {
            const l = (x & 0xFFFF) + (y & 0xFFFF); const m = (x >> 16) + (y >> 16) + (l >> 16); return (m << 16) | (l & 0xFFFF);
        }
        function rl (n, c) {
            return (n << c) | (n >>> (32 - c));
        }
        function cm (q, a, b, x, s, t) {
            return ad(rl(ad(ad(a, q), ad(x, t)), s), b);
        }
        function ff (a, b, c, d, x, s, t) {
            return cm((b & c) | ((~b) & d), a, b, x, s, t);
        }
        function gg (a, b, c, d, x, s, t) {
            return cm((b & d) | (c & (~d)), a, b, x, s, t);
        }
        function hh (a, b, c, d, x, s, t) {
            return cm(b ^ c ^ d, a, b, x, s, t);
        }
        function ii (a, b, c, d, x, s, t) {
            return cm(c ^ (b | (~d)), a, b, x, s, t);
        }
        function sb (x) {
            let i; const nblk = ((x.length + 8) >> 6) + 1; const blks = new Array(nblk * 16); for (i = 0; i < nblk * 16; i++) blks[i] = 0;
            for (i = 0; i < x.length; i++) blks[i >> 2] |= x.charCodeAt(i) << ((i % 4) * 8);
            blks[i >> 2] |= 0x80 << ((i % 4) * 8); blks[nblk * 16 - 2] = x.length * 8; return blks;
        }
        let i; const x = sb(inputString); let a = 1732584193; let b = -271733879; let c = -1732584194; let d = 271733878; let olda; let oldb; let oldc; let oldd;
        for (i = 0; i < x.length; i += 16) {
            olda = a; oldb = b; oldc = c; oldd = d;
            a = ff(a, b, c, d, x[i + 0], 7, -680876936); d = ff(d, a, b, c, x[i + 1], 12, -389564586); c = ff(c, d, a, b, x[i + 2], 17, 606105819);
            b = ff(b, c, d, a, x[i + 3], 22, -1044525330); a = ff(a, b, c, d, x[i + 4], 7, -176418897); d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
            c = ff(c, d, a, b, x[i + 6], 17, -1473231341); b = ff(b, c, d, a, x[i + 7], 22, -45705983); a = ff(a, b, c, d, x[i + 8], 7, 1770035416);
            d = ff(d, a, b, c, x[i + 9], 12, -1958414417); c = ff(c, d, a, b, x[i + 10], 17, -42063); b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = ff(a, b, c, d, x[i + 12], 7, 1804603682); d = ff(d, a, b, c, x[i + 13], 12, -40341101); c = ff(c, d, a, b, x[i + 14], 17, -1502002290);
            b = ff(b, c, d, a, x[i + 15], 22, 1236535329); a = gg(a, b, c, d, x[i + 1], 5, -165796510); d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
            c = gg(c, d, a, b, x[i + 11], 14, 643717713); b = gg(b, c, d, a, x[i + 0], 20, -373897302); a = gg(a, b, c, d, x[i + 5], 5, -701558691);
            d = gg(d, a, b, c, x[i + 10], 9, 38016083); c = gg(c, d, a, b, x[i + 15], 14, -660478335); b = gg(b, c, d, a, x[i + 4], 20, -405537848);
            a = gg(a, b, c, d, x[i + 9], 5, 568446438); d = gg(d, a, b, c, x[i + 14], 9, -1019803690); c = gg(c, d, a, b, x[i + 3], 14, -187363961);
            b = gg(b, c, d, a, x[i + 8], 20, 1163531501); a = gg(a, b, c, d, x[i + 13], 5, -1444681467); d = gg(d, a, b, c, x[i + 2], 9, -51403784);
            c = gg(c, d, a, b, x[i + 7], 14, 1735328473); b = gg(b, c, d, a, x[i + 12], 20, -1926607734); a = hh(a, b, c, d, x[i + 5], 4, -378558);
            d = hh(d, a, b, c, x[i + 8], 11, -2022574463); c = hh(c, d, a, b, x[i + 11], 16, 1839030562); b = hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = hh(a, b, c, d, x[i + 1], 4, -1530992060); d = hh(d, a, b, c, x[i + 4], 11, 1272893353); c = hh(c, d, a, b, x[i + 7], 16, -155497632);
            b = hh(b, c, d, a, x[i + 10], 23, -1094730640); a = hh(a, b, c, d, x[i + 13], 4, 681279174); d = hh(d, a, b, c, x[i + 0], 11, -358537222);
            c = hh(c, d, a, b, x[i + 3], 16, -722521979); b = hh(b, c, d, a, x[i + 6], 23, 76029189); a = hh(a, b, c, d, x[i + 9], 4, -640364487);
            d = hh(d, a, b, c, x[i + 12], 11, -421815835); c = hh(c, d, a, b, x[i + 15], 16, 530742520); b = hh(b, c, d, a, x[i + 2], 23, -995338651);
            a = ii(a, b, c, d, x[i + 0], 6, -198630844); d = ii(d, a, b, c, x[i + 7], 10, 1126891415); c = ii(c, d, a, b, x[i + 14], 15, -1416354905);
            b = ii(b, c, d, a, x[i + 5], 21, -57434055); a = ii(a, b, c, d, x[i + 12], 6, 1700485571); d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
            c = ii(c, d, a, b, x[i + 10], 15, -1051523); b = ii(b, c, d, a, x[i + 1], 21, -2054922799); a = ii(a, b, c, d, x[i + 8], 6, 1873313359);
            d = ii(d, a, b, c, x[i + 15], 10, -30611744); c = ii(c, d, a, b, x[i + 6], 15, -1560198380); b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
            a = ii(a, b, c, d, x[i + 4], 6, -145523070); d = ii(d, a, b, c, x[i + 11], 10, -1120210379); c = ii(c, d, a, b, x[i + 2], 15, 718787259);
            b = ii(b, c, d, a, x[i + 9], 21, -343485551); a = ad(a, olda); b = ad(b, oldb); c = ad(c, oldc); d = ad(d, oldd);
        }
        return rh(a) + rh(b) + rh(c) + rh(d);
    }
}

module.exports = StringUtil;
