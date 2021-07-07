const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const formatMessage = require('format-message');

const blockIconURI = 'data:image/svg+xml;base64,PHN2ZyBpZD0i5Zu+5bGCXzEiIGRhdGEtbmFtZT0i5Zu+5bGCIDEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDQwIDQwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6IzBmYmQ4Yzt9LmNscy0ye2ZpbGw6I2ZmZjt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPlJlZGxpc3QgTE9HTzwvdGl0bGU+PHJlY3QgY2xhc3M9ImNscy0xIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iMjguOSA5LjggMjguODUgOS44NiAyOC44NSAxNi40NSAzMi4yIDEzLjEgMjguOSA5LjgiLz48cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik0zNC4xMiw4LjY5bC0uODEtLjgxYTEuNzQsMS43NCwwLDAsMC0yLjQ4LDBsLTEsMSwzLjMsMy4zLDEtMUExLjc0LDEuNzQsMCwwLDAsMzQuMTIsOC42OVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDApIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNMjIuMywyMi44MkgyMC4wNmEuODkuODksMCwwLDEtLjg4LS44OFYxOS43YS40OC40OCwwLDAsMSwuMTMtLjMxbDkuNTQtOS41M1Y5LjRBMi40LDIuNCwwLDAsMCwyNi40NSw3SDguNEEyLjM5LDIuMzksMCwwLDAsNiw5LjRWMzAuNkEyLjM5LDIuMzksMCwwLDAsOC40LDMzaDE4YTIuNCwyLjQsMCwwLDAsMi40LTIuNFYxNi40NWwtNi4yNCw2LjI0QS40OC40OCwwLDAsMSwyMi4zLDIyLjgyWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCkiLz48cmVjdCBjbGFzcz0iY2xzLTEiIHg9IjkuNjQiIHk9IjEwLjUyIiB3aWR0aD0iMTQuMDYiIGhlaWdodD0iMS43NiIgcng9IjAuNTYiLz48cmVjdCBjbGFzcz0iY2xzLTEiIHg9IjkuNjQiIHk9IjE1Ljc5IiB3aWR0aD0iOS42NyIgaGVpZ2h0PSIxLjc2IiByeD0iMC41NiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE3LjEzLDI2LjgzSDE5LjN2MS4wNkgxNS4wN1YyNi43N2EyLjUxLDIuNTEsMCwwLDAsLjg1LS4zMywyLjY3LDIuNjcsMCwwLDAsLjY3LS41OCwzLjE0LDMuMTQsMCwwLDAsLjQ0LS43OCwyLjY2LDIuNjYsMCwwLDAsLjE1LS45LDIuNTIsMi41MiwwLDAsMC0uMjEtMSwyLjY5LDIuNjksMCwwLDAtLjU2LS44NCwyLjcxLDIuNzEsMCwwLDAtLjg0LS41NywyLjYxLDIuNjEsMCwwLDAtMi4wNSwwLDIuNiwyLjYsMCwwLDAtLjg0LjU3LDIuNzEsMi43MSwwLDAsMC0uNTcuODQsMi41MiwyLjUyLDAsMCwwLS4yMSwxLDIuNDQsMi40NCwwLDAsMCwuMTYuOSwyLjY1LDIuNjUsMCwwLDAsMS4xLDEuMzYsMi41MSwyLjUxLDAsMCwwLC44NS4zM3YxLjEySDkuNzhWMjYuODNIMTJhMy44NywzLjg3LDAsMCwxLS44Mi0xLjIxLDMuNjcsMy42NywwLDAsMS0uMjktMS40NCwzLjU4LDMuNTgsMCwwLDEsLjI5LTEuNDMsMy43MywzLjczLDAsMCwxLC44LTEuMTgsMy44LDMuOCwwLDAsMSwxLjE3LS44LDMuNzIsMy43MiwwLDAsMSwyLjg4LDAsMy44NSwzLjg1LDAsMCwxLDEuMTguOEEzLjcxLDMuNzEsMCwwLDEsMTgsMjIuNzVhMy40MiwzLjQyLDAsMCwxLC4yOSwxLjQzQTMuNSwzLjUsMCwwLDEsMTgsMjUuNjIsMy41NiwzLjU2LDAsMCwxLDE3LjEzLDI2LjgzWk0xOS4zLDMwSDkuNzhWMjlIMTkuM1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDApIi8+PC9zdmc+';
const menuIconURI = 'data:image/svg+xml;base64,PHN2ZyBpZD0i5Zu+5bGCXzEiIGRhdGEtbmFtZT0i5Zu+5bGCIDEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDQwIDQwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6bm9uZTt9LmNscy0ye2ZpbGw6IzBmYmQ4Yzt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPlJlZGxpc3QgTE9HT2luU2NyaXB0PC90aXRsZT48cmVjdCBjbGFzcz0iY2xzLTEiIHg9IjcuMDkiIHk9IjE0LjcyIiB3aWR0aD0iMTEuOTUiIGhlaWdodD0iMi4xNyIgcng9IjAuNjkiLz48cmVjdCBjbGFzcz0iY2xzLTEiIHg9IjcuMDkiIHk9IjguMiIgd2lkdGg9IjE3LjM4IiBoZWlnaHQ9IjIuMTciIHJ4PSIwLjY5Ii8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTkuMDUsMTkuMThhLjU1LjU1LDAsMCwwLS4xNi4zOHYyLjc2QTEuMDksMS4wOSwwLDAsMCwyMCwyMy40MWgyLjc2YS41Ny41NywwLDAsMCwuMzktLjE2bDcuNzEtNy43MlY3LjM5WiIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMiIgcG9pbnRzPSIzMC44NCA3LjM4IDMwLjg0IDE1LjUzIDM0Ljk4IDExLjM5IDMwLjkxIDcuMzIgMzAuODQgNy4zOCIvPjxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTM3LjM2LDUuOTRsLTEtMWEyLjE3LDIuMTcsMCwwLDAtMy4wNywwTDMyLjA3LDYuMTZsNC4wOCw0LjA3TDM3LjM2LDlBMi4xNywyLjE3LDAsMCwwLDM3LjM2LDUuOTRaIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNMjIuNzQsMjMuNDFIMjBhMS4wOSwxLjA5LDAsMCwxLTEuMDktMS4wOVYxOS41NmEuNTUuNTUsMCwwLDEsLjE2LS4zOEwzMC44NCw3LjM5VjYuODJhMywzLDAsMCwwLTMtM0g1LjU2YTMsMywwLDAsMC0zLDNWMzNhMywzLDAsMCwwLDMsM0gyNy44OGEzLDMsMCwwLDAsMy0zVjE1LjUzbC03LjcxLDcuNzJBLjU3LjU3LDAsMCwxLDIyLjc0LDIzLjQxWk03LjA5LDguOWEuNjkuNjksMCwwLDEsLjY5LS43aDE2YS42OS42OSwwLDAsMSwuNjkuN3YuNzhhLjY5LjY5LDAsMCwxLS42OS42OWgtMTZhLjY5LjY5LDAsMCwxLS42OS0uNjlaTTE3LjgxLDMyLjNINlYzMUgxNy44MVptMC0yLjYySDEyLjU3VjI4LjNhMy4xNiwzLjE2LDAsMCwwLDEuMDYtLjQxLDMuNTQsMy41NCwwLDAsMCwuODItLjcyLDMuNDksMy40OSwwLDAsMCwuNTQtMSwzLjE3LDMuMTcsMCwwLDAsLjItMS4xMSwzLjIxLDMuMjEsMCwwLDAtLjI2LTEuMjcsMy4yNywzLjI3LDAsMCwwLTEuNzQtMS43NCwzLjM1LDMuMzUsMCwwLDAtMi41NCwwLDMuMjcsMy4yNywwLDAsMC0xLjc0LDEuNzQsMy4yMSwzLjIxLDAsMCwwLS4yNiwxLjI3LDMuMTcsMy4xNywwLDAsMCwuMiwxLjExLDMuNDksMy40OSwwLDAsMCwuNTQsMSwzLjU0LDMuNTQsMCwwLDAsLjgyLjcyLDMuMTksMy4xOSwwLDAsMCwxLC40MXYxLjM4SDZ2LTEuM0g4LjcyYTQuNzUsNC43NSwwLDAsMS0xLTEuNSw0LjU4LDQuNTgsMCwwLDEsMC0zLjU2LDQuNzQsNC43NCwwLDAsMSwyLjQ0LTIuNDQsNC43LDQuNywwLDAsMSwzLjU2LDAsNC43NCw0Ljc0LDAsMCwxLDIuNDQsMi40NCw0LjU4LDQuNTgsMCwwLDEsMCwzLjU2LDQuNzUsNC43NSwwLDAsMS0xLDEuNWgyLjY5Wm0uNTQtMTIuNzlINy43OGEuNjkuNjksMCwwLDEtLjY5LS42OXYtLjc5YS42OS42OSwwLDAsMSwuNjktLjY5SDE4LjM1YS42OS42OSwwLDAsMSwuNjkuNjl2Ljc5QS42OS42OSwwLDAsMSwxOC4zNSwxNi44OVoiLz48L3N2Zz4=';

class ClipCCJSONBlocks {
    constructor(runtime) {
        this.runtime = runtime;
    }

    getInfo() {
        return {
            id: 'ccjson',
            name: 'JSON',
            color1: '#FFB11B',
            //menuIconURI: menuIconURI,
            //blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: 'getValueByKey',
                    text: formatMessage({
                        id: 'ccjson.getValueByKey',
                        default: 'get [KEY] in [JSON]',
                        description: 'get value in json object by key'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        KEY: {
                            type: ArgumentType.STRING,
                            defaultValue: 'key'
                        },
                        JSON: {
                            type: ArgumentType.STRING,
                            defaultValue: '{"key": "value"}'
                        }
                    }
                },
                {
                    opcode: 'setValueByKey',
                    text: formatMessage({
                        id: 'ccjson.setValueByKey',
                        default: 'set [KEY] to [VALUE] in [JSON]',
                        description: 'set value in json object by key'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        KEY: {
                            type: ArgumentType.STRING,
                            defaultValue: 'key'
                        },
                        VALUE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'sample'
                        },
                        JSON: {
                            type: ArgumentType.STRING,
                            defaultValue: '{"key": "value"}'
                        }
                    }
                }
            ]
        }
    }

    getValueByKey(args, util) {
        return Cast.toString(JSON.parse(Cast.toString(args.JSON))[Cast.toString(args.KEY)]);
    }

    setValueByKey(args, util) {
        let obj = JSON.parse(Cast.toString(args.JSON));
        obj[Cast.toString(args.KEY)] = Cast.toString(args.VALUE);
        return JSON.stringify(obj);
    }
}

module.exports = ClipCCJSONBlocks;
