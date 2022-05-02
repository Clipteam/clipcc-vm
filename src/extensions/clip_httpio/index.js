const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');
const axios = require('axios').default;
const config = {
    baseURL: 'https://data.codingclip.com/',
    timeout: 10000
};

// eslint-disable-next-line max-len
const defaultUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36';

class HttpIO {
    constructor(runtime) {
        this.runtime = runtime;
        this.client = axios.create(config);
    }
    getInfo() {
        return {
            id: 'httpio',
            name: formatMessage({
                id: 'httpio.categoryName',
                default: 'HttpIO',
                description: 'HttpIO Extension'
            }),
            blocks: [
                {
                    opcode: 'setUA',
                    text: formatMessage({
                        id: 'httpio.setUA',
                        default: 'set UA to [UA]',
                        description: 'http set useragent'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        UA: {
                            type: ArgumentType.STRING,
                            defaultValue: defaultUA
                        }
                    }
                },
                {
                    opcode: 'setHeader',
                    text: formatMessage({
                        id: 'httpio.setHeader',
                        default: 'set header to [HEADER]',
                        description: 'http set header'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        HEADER: {
                            type: ArgumentType.STRING,
                            defaultValue: JSON.stringify({
                                'Content-Type': 'application/json;charset=utf-8',
                                'User-Agent': defaultUA
                            })
                        }
                    }
                },
                {
                    opcode: 'httpGet',
                    text: formatMessage({
                        id: 'httpio.httpGet',
                        default: 'get [URL]',
                        description: 'http get'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        URL: {
                            type: ArgumentType.STRING,
                            defaultValue: 'https://api.codingclip.com/v1/project/getDetail?id=24'
                        }
                    }
                },
                {
                    opcode: 'httpPost',
                    text: formatMessage({
                        id: 'httpio.httpPost',
                        default: 'post [URL] with JSON [JSON]',
                        description: 'http post'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        URL: {
                            type: ArgumentType.STRING,
                            defaultValue: 'https://www.example.com'
                        },
                        JSON: {
                            type: ArgumentType.STRING,
                            defaultValue: `{"key": "value"}`
                        }
                    }
                }]
        };
    }

    setUA(args) {
        this.client.defaults.headers.common['User-Agent'] = args.UA;
    }

    setHeader(args) {
        const header = JSON.parse(args.HEADER);
        this.client.defaults.headers.common = Object.assign(this.client.defaults.headers.common, header);
    }

    httpGet(args) {
        return new Promise((resolve, reject) => {
            this.client.get(args.URL).then(res => {
                if (typeof res.data === 'object') resolve(JSON.stringify(res.data));
                resolve(res.data);
            })
                .catch(err => reject(err));
        });
    }

    httpPost (args) {
        return new Promise((resolve, reject) => {
            const postData = JSON.parse(args.JSON);
            /*
            const target = util.target;
            const keys = Object.keys(target.variables).filter(k => k.startsWith(args.PREFIX));
            for (const key of keys) {
                postData[key] = target.variables[key].value;
            }
            */
            this.client.post(args.URL, postData).then(res => {
                if (typeof res.data === 'object') resolve(JSON.stringify(res.data));
                resolve(res.data);
            })
                .catch(err => reject(err));
        });
    }
}

module.exports = HttpIO;
