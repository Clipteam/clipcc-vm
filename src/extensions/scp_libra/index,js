const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');

const axios = require('axios').default;

const blockIconURI = 'data:image/svg+xml;base64,PHN2ZyBpZD0i5Zu+5bGCXzEiIGRhdGEtbmFtZT0i5Zu+5bGCIDEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDQwIDQwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6IzBmYmQ4Yzt9LmNscy0ye2ZpbGw6I2ZmZjt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPlJlZGxpc3QgTE9HTzwvdGl0bGU+PHJlY3QgY2xhc3M9ImNscy0xIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iMjguOSA5LjggMjguODUgOS44NiAyOC44NSAxNi40NSAzMi4yIDEzLjEgMjguOSA5LjgiLz48cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik0zNC4xMiw4LjY5bC0uODEtLjgxYTEuNzQsMS43NCwwLDAsMC0yLjQ4LDBsLTEsMSwzLjMsMy4zLDEtMUExLjc0LDEuNzQsMCwwLDAsMzQuMTIsOC42OVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDApIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNMjIuMywyMi44MkgyMC4wNmEuODkuODksMCwwLDEtLjg4LS44OFYxOS43YS40OC40OCwwLDAsMSwuMTMtLjMxbDkuNTQtOS41M1Y5LjRBMi40LDIuNCwwLDAsMCwyNi40NSw3SDguNEEyLjM5LDIuMzksMCwwLDAsNiw5LjRWMzAuNkEyLjM5LDIuMzksMCwwLDAsOC40LDMzaDE4YTIuNCwyLjQsMCwwLDAsMi40LTIuNFYxNi40NWwtNi4yNCw2LjI0QS40OC40OCwwLDAsMSwyMi4zLDIyLjgyWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCkiLz48cmVjdCBjbGFzcz0iY2xzLTEiIHg9IjkuNjQiIHk9IjEwLjUyIiB3aWR0aD0iMTQuMDYiIGhlaWdodD0iMS43NiIgcng9IjAuNTYiLz48cmVjdCBjbGFzcz0iY2xzLTEiIHg9IjkuNjQiIHk9IjE1Ljc5IiB3aWR0aD0iOS42NyIgaGVpZ2h0PSIxLjc2IiByeD0iMC41NiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE3LjEzLDI2LjgzSDE5LjN2MS4wNkgxNS4wN1YyNi43N2EyLjUxLDIuNTEsMCwwLDAsLjg1LS4zMywyLjY3LDIuNjcsMCwwLDAsLjY3LS41OCwzLjE0LDMuMTQsMCwwLDAsLjQ0LS43OCwyLjY2LDIuNjYsMCwwLDAsLjE1LS45LDIuNTIsMi41MiwwLDAsMC0uMjEtMSwyLjY5LDIuNjksMCwwLDAtLjU2LS44NCwyLjcxLDIuNzEsMCwwLDAtLjg0LS41NywyLjYxLDIuNjEsMCwwLDAtMi4wNSwwLDIuNiwyLjYsMCwwLDAtLjg0LjU3LDIuNzEsMi43MSwwLDAsMC0uNTcuODQsMi41MiwyLjUyLDAsMCwwLS4yMSwxLDIuNDQsMi40NCwwLDAsMCwuMTYuOSwyLjY1LDIuNjUsMCwwLDAsMS4xLDEuMzYsMi41MSwyLjUxLDAsMCwwLC44NS4zM3YxLjEySDkuNzhWMjYuODNIMTJhMy44NywzLjg3LDAsMCwxLS44Mi0xLjIxLDMuNjcsMy42NywwLDAsMS0uMjktMS40NCwzLjU4LDMuNTgsMCwwLDEsLjI5LTEuNDMsMy43MywzLjczLDAsMCwxLC44LTEuMTgsMy44LDMuOCwwLDAsMSwxLjE3LS44LDMuNzIsMy43MiwwLDAsMSwyLjg4LDAsMy44NSwzLjg1LDAsMCwxLDEuMTguOEEzLjcxLDMuNzEsMCwwLDEsMTgsMjIuNzVhMy40MiwzLjQyLDAsMCwxLC4yOSwxLjQzQTMuNSwzLjUsMCwwLDEsMTgsMjUuNjIsMy41NiwzLjU2LDAsMCwxLDE3LjEzLDI2LjgzWk0xOS4zLDMwSDkuNzhWMjlIMTkuM1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDApIi8+PC9zdmc+';

const menuIconURI = blockIconURI

class SCPRedlist {
    constructor(runtime) {
        this.runtime = runtime;
    }
    static get STATE_KEY() {
        return 'Libra.Libra';
    }
    getInfo() {
        return {
            id: "libra",
            name: formatMessage({
                id: "libra",
                default: "Libra",
                description: "Labra Redlist Plugin"
            }),
            menuIconURI: menuIconURI,
            blockIconURI: blockIconURI,
            blocks: [{
                opcode: 'isInList',
                text: formatMessage({
                    id: 'isInList',
                    default: 'is [NAME] in the redlist?',
                    description: 'redlist check'
                }),
                blockType: BlockType.BOOLEAN,
                arguments: {
                    NAME: {
                        type: ArgumentType.STRING,
                        defaultValue: "Zerdot"
                    }
                }
            },
            {
                opcode: 'reason',
                text: formatMessage({
                    id: 'inListReason',
                    default: 'reason of [NAME] being in redlist',
                    description: 'redlist reason'
                }),
                blockType: BlockType.REPORTER,
                arguments: {
                    NAME: {
                        type: ArgumentType.STRING,
                        defaultValue: "Zerdot"
                    }
                }
            }]
        }
    }
    isInList(args) {
        let data = new FormData();
        data.append('user', args.NAME);
        data.append('format', 'name');
        data.append('from', 'acamp');
        return new Promise(function (resolve, reject) {
            axios.post('https://redlist.zerlight.top:1100/isInList', data).then(function (res) {
                resolve(res['data']['status'] == "yes" ?  true : false);
            });
        });
    }
    reason(args){
        let data = new FormData();
        data.append('user', args.NAME);
        data.append('format', 'name');
        data.append('from', 'acamp');
        return new Promise(function (resolve, reject) {
            axios.post('https://redlist.zerlight.top:1100/isInList', data).then(function (res) {
                resolve(res['data']['status'] == "yes" ?  res['data']['reason'] : "The user isn't in the redlist");
            });
        });
    }
}
module.exports = SCPRedlist;
