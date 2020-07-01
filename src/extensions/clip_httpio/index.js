const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const ObjectToArrayUtil = require('./ObjectToArrayUtil');
const formatMessage = require('format-message');

const blockIconURI = 'data:image/svg+xml;base64,PHN2ZyBpZD0i5Zu+5bGCXzEiIGRhdGEtbmFtZT0i5Zu+5bGCIDEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDE4MC4zMyAxOTkuMTMiPjxkZWZzPjxzdHlsZT4uY2xzLTF7ZmlsbDojZmZmO308L3N0eWxlPjwvZGVmcz48dGl0bGU+Q2xpcExPR08tQ2xhc3NpY19XaGl0ZTwvdGl0bGU+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTMxLjU5LDEuM2M5LjE2LS44NCwxOC45LS44NSwyNy4yLDMuNjcsMTQuMzksNi4yNiwyNC43NywyMC40OCwyNi43OSwzNiwuMjMsNi40MS43LDEzLjA3LTEuNDcsMTkuMjRhNTUuMTQsNTUuMTQsMCwwLDEtNS44NiwxMi42OWMtMy4wNyw0LjkyLTcuNjUsOC41OC0xMS41OSwxMi43NHEtMzYuODEsMzYuNzYtNzMuNTUsNzMuNjFjLTQuNjcsNC42NS05LjI5LDkuNzEtMTUuNjMsMTIuMDUtNSwyLjM1LTEwLjYyLDIuNDgtMTYuMDcsMi4yMUM0OCwxNzIuNCwzNi4yNSwxNjIsMzIuOSwxNDkuMTJjLTMuMTQtMTAuOTEuMjUtMjMuMDYsNy43Ny0zMS4zOVE1OS40LDk5LDc4LjA3LDgwLjI5YzIuMTktMi4zNyw2LTMuNDksOC45LTEuODMsMy44NywxLjksNSw3LjkyLDEuODIsMTAuOTFDNzYuMTYsMTAyLjI1LDYzLDExNC42Myw1MC42OCwxMjcuNzhjLTQuNjMsNC43MS01LjkxLDExLjk0LTQuMzUsMTguMiwyLjI4LDYuNTQsOCwxMi4yNCwxNS4wNiwxMy4xMiwzLjc1LjM1LDcuNjguMzEsMTEuMi0xLjIsMy45NC0xLjU5LDYuNjktNSw5LjYyLTcuODcsMjYuNTgtMjYuNDIsNTIuNzktNTMuMTgsNzkuMzgtNzkuNTdhMzIuNTIsMzIuNTIsMCwwLDAsMTAuMTctMjEuMUMxNzMsMzIuNjIsMTU5LjMsMTUuNjksMTQyLjE0LDE1LjE5YTMxLjgsMzEuOCwwLDAsMC0yNC44Myw4LjQ2Qzg4Ljc0LDUyLDYwLjYxLDgwLjc2LDMyLjA1LDEwOS4xMSwyNS4yOCwxMTUuNzksMjEuNDEsMTI1LDIwLDEzNC4yN2MtMi4yNSwxNS45LDQuNjcsMzIuODYsMTcuNzIsNDIuMzJhNDUuMSw0NS4xLDAsMCwwLDI5LjYyLDkuMzJjMTIuNjQtLjUxLDI0LjQ2LTcsMzIuOTMtMTYuMThDMTEwLjU1LDE1OS4zLDEyMSwxNDksMTMxLjI5LDEzOC41NWMxLjY1LTEuNjQsMy4xOC0zLjUxLDUuMzEtNC41NGExMC42MywxMC42MywwLDAsMSw2LjYyLjI1YzIuNjEsMS4wNywzLjUsNC4xNywzLjQxLDYuNzYtLjMxLDIuNi0yLjIxLDQuNTktNCw2LjMycS02LjQyLDYuMjEtMTIuNTUsMTIuNjhjLTguNTgsNy45NS0xNi42MSwxNi40Ny0yNSwyNC42M2E1OCw1OCwwLDAsMS0zMy44OSwxNC45M2MtOS40MiwxLjMtMTktLjU4LTI3Ljg4LTMuNjVBNDguNDgsNDguNDgsMCwwLDEsMzMsMTkwLjQ3QzI1LDE4NS43NSwxOC44NSwxNzguNTcsMTMuODEsMTcxYy01LjI2LTkuMzUtOC42NS0yMC04LjMzLTMwLjgtLjI1LTEwLjc3LDMuMjEtMjEuMzEsOC41My0zMC41Nyw0Ljg3LTguMDcsMTItMTQuMzgsMTguNTUtMjFDNTcsNjQsODEuODIsMzkuNzUsMTA2LjIxLDE1LjA5QTQ1LjI2LDQ1LjI2LDAsMCwxLDEzMS41OSwxLjNaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNS40NiAtMC44NykiLz48L3N2Zz4=';
const menuIconURI = 'data:image/svg+xml;base64,PHN2ZyBpZD0i5Zu+5bGCXzEiIGRhdGEtbmFtZT0i5Zu+5bGCIDEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHZpZXdCb3g9IjAgMCAyMTcgMjM2Ij48ZGVmcz48c3R5bGU+LmNscy0xe29wYWNpdHk6MC40O30uY2xzLTJ7ZmlsbDojZmY2NjgxO308L3N0eWxlPjwvZGVmcz48dGl0bGU+Q2xpcExPR08tQ2xhc3NpYy1QaW5rK1NoYWRlPC90aXRsZT48aW1hZ2UgY2xhc3M9ImNscy0xIiB3aWR0aD0iMjE3IiBoZWlnaHQ9IjIzNiIgeGxpbms6aHJlZj0iZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFOa0FBQURzQ0FZQUFBRDVDUU5vQUFBQUNYQklXWE1BQUFzU0FBQUxFZ0hTM1g3OEFBQWdBRWxFUVZSNFh1MmRhM2ZpT3JPRWl6REo3TXY1LzcvMDNYdFBMb1R6QVdwY0xxb2xPd1NDaVh1dFhqSlh5K3ArVkMyWnlXejIrejFXVzIyMXk5bEQ3dzJycmJiYWViWkN0dHBxRjdZZnZUZXN0bHF5eldhejZiMW5ydTN2ZE8yeXVkUHJXdTBUYlFKUXZkZDdWaWJoUFlDM1FyWmF0QUtzQ3FaTFFIYnkzRktCV3lGYjdiY0ZzRnFQcStPNXBnbFlIWjg4WGhKd0syVGYzRHBnYmF4TnozMFV0Z1NVdDczbkRnOXVQSWxYeUw2cEdWd1ZSQW1vQ3JJRVhjc1NXRk9PdFIwZDN5cHNLMlRmekFxNEtvZzJuZWRhOE5INE9KVi9EbEp5ZnoxOVZ0dWJnMjNkd3Y4bTFvQ3JCVkR5aDhaci90M0pwb0MxQi9BKzRUMEpwajJ2OVZaZ1c1WHN6cTBERng4N09BL2h1R3A3c0xrNUlBclQrOFEyUVlod2ZEajQ0aVJmSWJ0VG13Q1grd1BHQUQxMG51dkJCbWxwRGtHQ3FPWCtIb1hzM2M1eE03Q3Q1ZUlkbWdDVzJrcVY2TnZHWTMrdEI1dGJwVjdKZCtGWW4zUGZ5UGNsMjI4Mm04MVhnTFpDZG1kbWdDVUZjekMyb2QwV2ovMjlGV3g2VHJXOWVRSnJaOGZKSy9EMk9KeFRJVmI3a3ZYYUN0bWRXQ2dQa3llRlVvQitoR045TGdHWFFLdlViQXBnN20rZGRpdnZwYUk1YUJHMmE0RzJRbllIVnBTSENsWlNyUVJUejZmQU5oZXlwRnh2RTkyaFN3cm5hemJhMVVCYklWdTROY3BEaGFzSDFxTzBqK0c1SG13dE5WUHJxWmdDOHdiZ05iVCtISSszeCtPSDQzZFF6WFlZYjRJb1ZGY3BIMWZJRm13QnNGWnAyQVByU1k3NStJYzlwNUFwYk9kQWxzcERCYXJsTDhmMkI4YWdKZGpZdXFJQkYxYTFGYklGV21mOTVYQ3BlamswVDlLNkovQmN6WDdJZVJRd3RwQ1dDY3dTTHBXS1dnb21vRjdzK0ZFZUV6VEM5b3FoSHp1TVRjdEhicFpjRExRVnNvVlpZLzNsYTY4ZVhQU2ZSYXV3ZVJuWlVySTVrTFhXWWdrdzkyY01zRDFqNkJNQmU4TzRQNnBzd05DUGk0SzJRcllnNndDV3lzTUtycDhUM0JWTlM4eEt4YnhVck1yRnFtU2NBdG16dEUvSGxvQzlTTHM5dGhzTXNDbG93T0hjRDdnd2FDdGtDN0dKZ0ZYcXBRcjFCd2FRL2hEWDUvVDkxWnFzdHg2RHRMUTlUa0diVWpJNlpPcS9NUFJUMVl4OVU5Z1VOT0JVMVg1dmtId21hQ3RrQzdBWmdPbWFLU25YSHhNOEtkbGN3T1pBdGtjTldsSXpoK3dKQjlCU1B6a3VPbFpKWVlFTHJ0Rld5RzdjUGdDWXE1Y0M5cWUwZjlwekNwbXZ5VnFBYlhDYXZGVWk3NlYxMEtxZFJnZU41ZUl2REpCTm5ReDhFbkRqTHVTbmdyWkNkc05XQUthSjdSc2NsWHI5MmZHa1lsb21walZZQlJldFN1UjlhS2RzaGhDeUoya0pXU3Bwdld5c0FOdmc4UDNBb1E4UHNEVWF6clFWc2h1MW1ZQ2xqUTJDb3pEOWRmUUVtYXBlVlhwTkxRdGJwdTlsQWo4YzJ4NXNCT3dWcHdybWdIRlM4UDYyRkJZWWI0enNnVU1zemxHekZiSWJ0Qm1BK2ZyTDExNEtsZ0xtb0tWMVdFc0plb25xajFzUTh2djJPSnlMYXNMSGhFMnY5UlZqdUJKb3JUVmp5OWh2dldsOVZ0bTRRblpqOWttQXVYTDlqUXhiV29lbEpQWGs5TFZWT3E1TXZ5Y3BvajUyMkg1Z0RCeXYzMHZFU24wcnEvbzdBcTE0VDlkV3lHN0l6Z1RNeTBPRnl5SHpNbEVCUytwRkkwanZqV045bjFzQzZxRTRkdWYxN3pBZWd4LzJXUHZmVXJDOWVYcHVJNjk5dUd4Y0lic1IreUJnZXUvTHkwTUZ6Q0h6alE0dkR6VXBOZW5lelhkeTdNQzFJRk53V3U3dkI4WmprYnoxSFdyYVA0ZkxRZnY5dm8rQXRrSjJBL1lCd0hTTDNRRnp1QlN5bG9KNVVqcFlmaTlMM2VGemRkRHJTdGRXZ2RPRFRsOXJLZGdJRkhQdnN6dHdadG00UXZiRjlrbUFFU0FIS3dIR2pRN2Q0R0JTMHRMdW52OGFZeWV0QXBpU2xGWUI1bXNwTHdVVklFS2pqeDNHQkpoQzMvSUUzZWc3NXFyWkN0a1gyaWNBcHVBNFdQK0hRZEg4ZnBodWNDaGdtbVIranlxMUNweVhqaTNJWEgzMEduV1hNTzBZT2x5cDlYRUZUaUZxZWFWbXYyR2JBOW9LMlJmWkp3S21hekRDNWVzd0x4RjVnNW5uMHdUVVgxcThZZnpQUy95Zm56aG9WY2xJVThoVXhSd3d2ZWYzS08zajhUczVOcXBxRzNOSVc2bVZUaWdWY0E4WTFNeWhuV1FyWkY5Z053UVlNRTQ2LzNWRnkxWFYwdnBzQ21SMFZTNjlWdmFaTjZKM0dNTkdKZWIzL3NBWUJDREQxVnBmdGxTWkV4SUFUQzRiVjhpdWJCY0NUT0ZLTzRuNkt3N08ra0JXcjlZdjNwOHhoa3pWckFlWnFnd2g5ekxSQVhzNXRxNlcrdDJxYXB3NGFKV0NUWVdNTGRXTW9PbjNkMjJGN0lwMkpjQjBvNk1GbUt0WEF1c1hoaC9pT21oVElJTzBCTXpYWkFreXZiSGVPOGZqOGZzZHRBU1l3L1VXZklmNlhPLzRnSnF0a0YzSnZnZ3dsb2RhVmdGandQVFg3UXBXOHJsS0JtbW5RT2IzL3RLNTBqbG9DaHB6MjFWTUo1YVcrL1dvb3MxU3N4V3lLOWdYQXZaMC9ENG1IeE51aDlOL1BrS1EvanY2TDJtblFLWktvUXBDNDdWWGtQRzYrY3Y2dFA1cmxhTTBCWTNyUFM4VkZTYmZ6RW1UeHhabnFOa0syWVh0aGdGakFqdGM2Z3BhV3BPMVZLd0YyUWJEdW94OTlGMUZUL2pxSE1sNHpkdmo0M01ob3pObXM5UnNoZXlDZGdPQThWeTZKcW5VNjE5ckZUU0ZqSi8zMGtyTHFncUFqYmhlUDhlZ2drd1RmZW81Zkp3Zk1aU0tmMkFBVEZYWlZmb1ZoMzY5WVZBekt0bEl6VnEyUW5ZaHUwSEFOS2tJR0VINjE5d2hTeHNlS2ZuMzBnS25TZWlRMFZYTlhFbGN4WkpDVnM3WHR4ajY5b1RUY3BtN21EL2xNVUYvdzZGLzdBT1ZqR3EyQjlBc0dWZklMbUEzQ0JpVFNqYzNISzUvTUZZenZxZmF1bStwaTRLZ3BWVWFqeTNHaXBFQWE2bGtCUzYvVzhlY1k3M0RBYWhYakRkWW5xWGx1dkFWUTd6NDNhcG12S1pTMVZiSVB0bHVFREJWTUpaK2hJbGdzYTFVTEszRDNqQk9mZ2VnS3VYWWNqeFlpbkd0cEtxUkFOUHY4ckYxeUFnYU1BYU5aYW5laStNdEF3S212ejdoZGJPZkJBMFFOYXRzaGV3VDdZWUJveHBwZWFpQU9XUzZvOWdDekV1NHVaRFJkeGpHSm9IbGdPbDNFS3F0dFFxYng4QkIwMzhaenVObkRMYy9XTTd5dTdYdnY1VjZzOW5FdjZtL1F2WkpkdU9BcVlJbHdMUlU5SFdZYjNSVUN1Tnc5U0JqUzFWSVlLWHlVRC9uY0xtN3FqbGs2UWI0ay9rekJzaGNMVmsycmtwMmFWc0FZSVFud1pVQWN3V2ppaEd1M2taSEsrbGN6ZmJTS2x6cGUvVnpDaG5IVnNkWVlkdEkyd0tOc0xGYzVIc2NYbTduODFxYXRrSjJwaTBFTUZXd0JKaVdpYjZUK0JrS3BxWlE2Wml4LzF2MFZaRFFxSE44dGNSVEJkSzQrUHMxSm8vbTFYZTU3d0hFWGNZVnNqUHNSZ0hUbTh3SnNQOWhyR2k2MFRFVnNFckIvTGhuQ3RxN0hGZkErcmpTSFF5SGhIRHdmS3BtbGFJNVpQd09kUWNOQ05lL1F2WkJXeUJnaEt1MTBURVZNSFhBRXF2MUU2UGp1UG5yVFA2VXFOWDRQaUJEb3JBNEpBcEVCVnBMeFJRMGg2dTBGYklQMklJQUkwd3R3SktDOFQ2WTdpS3FlcDNBMWZzbE9rM2ZWd0NuaXFhVzRQaUZYUEk5eXpFbkN5MzErSDBlSjNWWFFsY3lWN0hmMStJbDR3clpURnNZWUpXN2d2RUc3RndGbXd4WE1uNjJvVzRFanZlbXVONVUwQWpVc3pudmdhbWlxWnB4SEh0ck9vVXNyY202dGtJMnd4WU0yUDh3VnJhcVJIUUZLd0U3Qnk2My9YNi9ENkM5Mjl0Y3lYaHI0UkduZ0xWMlJsWE5xRW9hTjQzZjF2ekIzR0ZqT3hxYkZiS0p0bkRBcHBhSW1veFhBWXpXQVcyRG9XemRZZmlwMDZ2NGk3bGVrMTRYcjhPaDlmaTFBTnVZQTBOc1RteUZiSUo5TThDYTk4QXVBUml0QUkzOTRMMHBycTlZT2liQUhEVDltUmFCQVliNHVhSWxyMVNzYXc5WXJXbDNDRmoxZThRdkJZd1d6cUVxU25WbFh4VTA5emRwazVJQll6VnlpS2FxV0JlMlZja2FkcWVBNlV5Zk5qbStEREN6cEdZYmpDRWphUFRYY0t6djFSSllMU21hUTVjQW0yU3JraFcyQWdiZ2l3Q1Q4KzJEdTVvbDJOd2RNTDJlcEdaSjJUVCttaE5kNkZiSWdxMkFBV3l2RFJqTnpsdUI1cVdqd3VZUTZtZW1nT2JxbFFCemk2Q3RrSm10Z0FGc3Z3cXdoclZVTGFuYlhNQSs0dEVrajFiSTFGYkFBTFkzQ2hoYmhjeVZ6Y0ZMZ0tWcjY4R2tPVkhDbFd5RjdHZ3JZQURiR3dOTW9YQWw2NEhtMStqZlZWa0xzUFRlcHEyUVlRVU1CN3RGd0ZxV2dKdmlrTmF0cFZwVjI3VnZEOWtLR01EMnhnR3JnT0ZyMVhzY3JIU05QWVdhRFpiYXQ3NVBkbUhBMlBJMUFxYi9mZXdLMk8zWVJ3Q2FCTiszVmJJYkJZdy9FVm9CbTJkVmVUY0huTllZVkNyWVVzZmY5aTBodTJIQS9FOEdySUFOdGdtTzBGYnY5YytwcFRId2N2UEQ5dTNLeFJzQWJJdkJWc0ErYmdxTnh1OUJIbGR3SmRDQUdpeDlicEo2cVgwcnlENFpNTi9ZYUFIMkpOKzl3U0ZBL0hWQ0FveStBbmFxV2dtdWRPenVzRGxvKzRZakhPdm5tdlp0SVB0aXdGS0p1RU1ObUlMMW5RRlRhNEZHWnd3ZnBIV1ZVOUJvQ1N5L3Q1YWdtMlRmQXJJTEFxWmI5WCtKVDltbTV5YkhNMnJBRks1dkJaaitMQW1uZ0xsS2JTZTRxeHJObFVySHpXOXFUd1pOeC9udUlic2lZSCtqWG9NUnNEMnlnbFhyTUFYdDJ3QW01dVdkUStZZy9SRGZTcXVnNmZkTUFjemhjdERVNHZqZU5XUlhBb3lRVFNrUlhjRitvVjUvZlZ2QVRNV0F0bnI5S0x6Nm00a0tya05Ec05MdkhudkFsZVA3VUwyd2RMc0J3QmhZNEJDQTNob3NxWmNDcHYrYStUc0F0Z25PdUtYNHpmbWJpV29PMTg2T0UzQmRzTlR1VXNtK0FMQS9VWmVJbFlKVmtQa2E3QmRPL3dyVFhRSW1sa3BEZFk0eHh6djlZZElFV2xLeXBGNjc0RDAxSyszdUlMc0NZUCtIMDAwT1Z6QUNSZ1hqejZWNjk4SzhSUHlGQWJLN0I2d29FNnU0RWFTbmhyZEtSc1pIb1hyRDZmaFdpallhYTJsUDdLN0t4UnNDREtnQlUvVlMwS3BkUlAyclV0OEJzRlFpNmpxc0I1bi85MGVQT04zNEFIS1o2TEE1WURybWV6dUdIZisydTRIc3hnQmpRQkpnLytFVXNLUmdyVC9TK1IwQXErQWlZQTZXZTZWa1FGdkZkREpMazVxWGpWMjdpM0x4aW9EOWpkTk5EczZVRGxoYWd5WEFrbnE1Z24xM3dCaTdGbHgvWUlpTHFwbi9YcFNsb3FxWUErWi9XcTRIMmdnNGo4SGlsZXhHQWF2V1lMN1IwU29QdFVUMEFOOHpZQXBhdFE1enNOUmR5UmlqVkNvNllPbHZOM0w4MytRekRsalRGZzNaalFMVzJrVk03dXJWKzlQWkh0eDdBNnlDeTlWTHdmb1RwNkNwaWlsa1BjQmU3SEZ2SFJ6VlRHMnhrTjBJWUZyanYyTUlHR0g1VHp6QlZXMXdWQXFXRnRyM0JwaXZ3M1NEb3dLTTNvTU1PSVZNNFZMdmxZdVRTa1Znb1pEZElHQ3ROVmhMdmViK1RmcVR3TjRoWUsxTkRnV004ZE43bFJvbmo1V1dpbE1CYTAxNHBYSzVMVzdqNDhZQTh4bVJnTFhLeEdwem8xS3VXUUc5Wlp0UUlqN2dGQzRISzhIbGF2WVRZeFZ6d0RSbUNwZi9xa2FWek5ka2srT3lLTWh1R0RBR3FMVU9xOVRMeXhFcTExMVpZeGR4Z3lGdVdpSjZlZWlBcVZlbFlyVVc4eldZeG1ScWRhRndOV0ZiVExtNEFNQzhSUFExbHdMbXdlUE1DSndHUzVQU24wKy9rcmc1NjJ6VFY0QzF5a1A2M3hpRGx0WmlQTGRYSFFxVWVscVR0ZGJHemZVWXNCQWxXd2hncW1BSk1BWlBTdzhHQ3ppOU5nMWlBcTFicHR5Q2RRQkxhN0NrWUE0VzNaV01NYXMyTzN3ZGxpRHJnWmJXeHMxWTNEeGtDd1BNUGYzdVVFc09ZSng0VzNtK0NxQ1hrdnZOWnZ3ZmdkK0t6UVFzM1FOVHdQNDJyMHBGdmZsTVMydG5MZS9WSGJMZXppS0FXc1dBRzRmc3hnSHpNckczTGErQkFqSllORS9PbmIxKzg2QjlBREF2RVJOZ3JYOW14SmhwM0toZ1hJZjUyamtCcGlXOWIzcDR1VGpKYmhheUJRQldxVmNGV0FYWEp2aURIRmQyQWxwODF4ZFlZeGRScnowQmxuWVJwd0EyNWZaS2dpeXRsN1ZNMU1reGJYcDBTMFhnUmlGYkNHQlZtYWlCMHZJUU9QUi9LOGNQeDllMzVtOFladndXYktNWjlSYlVyQUdZeG8yeGF3RkdrRkxjMGxxTWNlUDVXeHNkT2htMlFFc3FOcXRVQkc0UXNnVUI1aVdpQjRuQm9WbzlZRmdyYkRFRVRXZEtKZ1RiRm1TcWd2cmNsMWtITUM4VDlaY2NhUWZ4YitUNFZZQnhiRGNZeWtRSFRLSHlqU212UHFxdGUwNllrMVFNdURISUZnYVlsNGNNa2dhSElIQ0c5VkxEUWRPa1lGOHF3T2diZWU3TDFLeUluUUxtSmVLVVRZNVVJazRCTENtWXhxMWFQL3NtbFZZaXJtUUEraW9HM0JCa0N3VE1mNzJoSlVZcUQvbFlqYUR4WER6ZkR4d0NudDVmK1FpMmE5b0hBT01HeDArTTQvWVpnS1dOanRiNldTSHpNckZhajAxV01lQkdJTHNEd0ZUQkVtQjZMYXBPREpiT3ZJL0g3M01WVStWN1A3NytqaUdoZndmOW1tcldpSjBDbHRaaDZVWnppcHNDbHJicXZVcW9BSnZ5RTdkcVBSM0JtanJHWHc3WndnSHpvT2dhekdkeWRiNmV6cW1KQTR4blo1MVZtNkJkdzJiR3poWE1TOFMweVpFVWpMSFhzZVFZcFJJeHdWV3RwWDB0bHNyRVdTb0dmREZrTTROMGk0QzVnaWxnM25lNnI3VzB2UEVicVp5WmZYTmtKOStoYXFkZ1h0UTZzZU0xS21EVlRtTGE1UGhJaWRoYmc5SFQzN0pNQ3BiS3hOODJWY1dBTDRUc2pnSFQ1TklaL0ZHZTh4bDRoMEhGRW1CTUlJNkpBcVkrT2ZEbjJJVFlwVEZRQlVzYkhYUFdZRnNNcHVWMjJ2M1ZmNEZlQVZhdHh5b2xtMlZmQXRtRUlDMEpzQjB5WUUvQjB6cUNzN0RlNTFGMVU0VlRKWFRRUm5hcGRka1pzV3VWaUpXS1ZZRDFGTXloNnYxTlN3S1dTc1dUTW5IdXVGNGRzak9DdEFUQXREVDZhVjVCUnBpMFQ3b0pvcVhtZzdnRGRuRTFteGs3TFJGOUhkWXFFeFd1SG1CVEZDejlOYkNrWWtuQnppb1RhVmVGYkdhUWxnQVljT2c3KzAyNDJOK2YwdnA2QWpnRThBM2o1R0YvcHFpWGorZkZiR2JzZktKSjVXR0NLMjF5dEFCN3hSQVgzK1Q0Qi9sL3g5RWRSVld3VjV4dUxKMVZKdEt1QnRuTUlDMEZNR0NjV0ZvV3FTdGszbzlYSE1hQXh3b1czK3RnWFJ3cXRabXhTMHJlVXpBRlRNZnNDVzNBV0NKcXpCeXVDcklYY2QzcytMUXlrWFlWeUdZR2FjbUFLVmhlOGxRSm93cW1ZSDJaYXFuTmpKMldpSnh3ZWdxbW9IRzhVdHdTWUJvemh5b0J4amhYWldKWktuNFVNT0FLa00wTTBsSUJTek0yajZ0U2tXdXZkNHpYV3NrMDRHZVZMbk5zWnV4OERlYXhxK0xIOHRCanB4TVMwQWZNVmN4THhkNUdSd1hZMldOOVVjaG1CdW1lQUtQek5lMFBsWXRCNWRoNGVWS3RDOUlhNGV4RWNKc1p1N21BZVltb3NmTTFHREFOc0twRTFJME9oOHczTytJWW42Tml3QVVoSzRKRS93NkF0VW9md2dPTW9kcDF2Rnd2MlBGWjlzbUFwYmdwYUJ3cmpwT3F2WTdMRzRhNFZJQlYvdzF3QWl4dDEvdlluZzBZY0VISWp1YUFzU1J5d0xTT1h5cGdxZXhKWmFKQ29YMVQxeVRvclJraVhCOU5qZ3NCbGtwRVY3QXBKZUpVd0x4RVRBcm00M2tSd0lBTFFTYUJBcVlCeGtHK044Q1lPRXhTZ3FXcVJhQmV6SFZydVFLTmlRRUUwT2JhQlFGejlVcXh1d1Jnakt1T3FaZUlEaGlBendNTXVBQmtGaWdITEFYcTNoU01wWThuanBlRjJxL253cjIwOGVSd3dENWNNbDRCTU1idUkydXdjd0hUdUY1OG84T3QyczM2a00wQUxBVkprM1pPa0pZQUdIQUlIdnVreWZPTWNkKzBQMVdKczhNWTJnL0RCWHdLWUwzWWFZbjRGM0xzTGdWWVVyQW1ZSitwWXNBbkt0bEV3SHdObG9KRW54dWtXd1RzQVVNUUZUQUhLL25jaGZwdm01TWtud3lZeHM1OURtQ01uWTdSUndGN1FRWnNEMXdlTU9DVGxReGp3QlMwQ2pCUDJnVFhsQ0RkS21CQURaajJoNjVKa3ZxWHlzVVBsNG96QVpzeU9YcmxvYkdycW8rdkF1eWszTDRFWU1BbktabHRkQUMxaXVrYXpKUFdvVW9xdGpUQVV1bWovZkd0Wm9WTnkwV3FHWk9rQW0xeW9ud0FNSTliaWwwTHNEK1JONE9BOWpndEdqRGdFNVNzS0JPbnpvUzZXSzVVckRVTExnMHc3Y3MvMG5yQ3FKS2xOVVcxOFRISnpnUnM2dVRJbUNiQWV1TjBONEFCWjBMMmllc3dEMVFyU1BjQW1NT2xpc2IzVllBMTF4UTlPd013eGs0bnhsYmw4VGRPSjhjcDQzUlhnQUZuUW5ZMFY3QVVyTG1BVldYR1VnRmpmeEpjRldDKzZWRUI5aHUwWHNLY0NaaFhIZ213ZEl1Rll6Vm5uTzRHTU9BTXlEcnJNQWNzbFlsL21idUMzZE1hek5YTGswY2gwektSa0duQ2VLa0lvSjh3WHdUWVR4ekdkT280M1IxZ3dCbVFIYTJsWUI5Uk1TMFJOYUh2Q2JDV2ltbGZOV21xWFVVdEYwdjdRc0Jhc2ZzV2dBRWZoTXhVek5kaHVoYWppcVhrclh4cWtKWUVXRkt4QkppcVdIVnZiRmFadUFMMnRZQUJINENzc1p2b1FVdUFlZEM4VFBRZ2VUSno0TjR3Qk9wV0FXTmZQcEk0YVIyV0lGc0J1M0hBZ0E5QWRyUUVtQWRNZzZZSm5KUk1FOW9CWTRMc01RVHBGVU9RYmhXd2p5U085N2NDRE1BS0dCWUFHREFUc21LelE4dEZWVEVIekV2RmxOQWFwQjhZa29LQVVjSHVFVEFxV0VvY0I2eVpNQ3RndHdNWU1CT3lvNlVTMFFQbk80by9NUVJPQTZqSm5JTGtnREZJR3FoN0FheEtuQWhZbFRncllOUEc2Wm8yR2JJSktzWUFWb0JwQUQyWms0SUJwNEF4VVArWjY2YkJQUUcyRndjNmliTUNObTJjcm0yVElUdGFTOFYwTGRiYThKZ0NHSk5FUzhRWEREQ3BpdEh2RWJESmliTUNObTJjdnNJbVFkYTU4YXdCVkJWTDZ6RnRGYklFR0FQbFpXSlNzUVFZQjNrRmJBWHNTMjBTWkVkekZhc0M2S1ZpQXEybllDbFFCT3lYdEZvbU9tQWJySUN0Z04yQXpZR001cVhpQTA0QlMwckc0TkFWTU4zbzBFQnhKOUVCY3hWTGdESEJGUG9Wc0JXd3Exc1hzdkRyamxZZ2ZkUGpqK0FNVWdvVUI4L0xSRitIRWE0WDFJQXA5S3FrYVYyNEFyWUNkakg3MFh2RDBhYVVpbWxYc1hJTjFCYjlNdkdYT1o4blpEcm9xbUJlSXE2QXJZQmQzWnBLMWxBeDliUWVjOUMwVlBReWtlZllZMUF3RDVpdXd4d3dCZ0NvUzBTSHpCVjFCV3dGN0dMV0xSY3hUY1Y2U3FibFlWcUhhWmxZcWRpenRBd0VTMFFjdjRmOTBUNGtCZE4rcllDdGdGM1Vwa0NtMWlzWG44d1RiRXdBSmdjd1ZqRlhNZ1dOZ2VBNmpBUGZBdXdQYVgxZHVBSzJBblp4S3lFclNrVXRGejJvcVZ6VWRvcUs2V2FIdXdLbUFXQ2Y5UHlwVEZ3QnV4NWdISmZXT0dsTVAyV2NidFY2U3BaS1JhcEdXbzlweWFpQU1WZzlGZU8ydllQbWdMRk1kTUIwRGVod2NaUERRUWVtSmM0SzJMUnhtakpHSHRlengrbVdyUWVabXFxWUJuZUxVN2dVTFBWS3hkNHhMaE1UWkw1VkQ0eEI1L24vQ082d3owMmNGYkQyT1AyTEROaS80aHdqWFZkclREbEdzOGZwMWkxQzFpZ1Z2VnowVWpHQmx0UkRWWXlBT1dTcVhocU05K05uVmNWVU9iVlVWQVY3d3FwZ2x3THNuOEtUZ3FXWU9tQjBvRE5PUzdDV2toRXFQVTVxNXFWaVVpOG05MWEraDBuSFFkWlMwU0ZUd0ZURjlOd0pNRlV3OW9IWHhITVQ3aFd3UG1BK1R2K2FxM3I5Sis0VmlaYjlDcGhDQm5UR2FTazJwVnlzVkt4U01xcFpWU2J5bkFxWktobEJleFdmVWlZU01OL05KR0M2RnRRU1ZVdFRUWndWc1BaRWxGVE1BZXVwVjZWZ3YwRmJPbUJBSDdLa1pqM1FLc0JVUlRpSUhrVDNsTEJhSnZLY0NsWlNNQVdNNTAySjQwbXpBamFlaUxpbVNpcVcxbDNQNkplR3dGaTk3czVPSUxQMTJPK25jVm9tZXNDOVBIVEErRmt0MTVqc3JtUWFtRGVjbG9tdVlyb2U0MlB0aTZxbko0NHJXSUpyQmF3UFY5cllxTVpGeDRESG5uY3BEeGRwbFpKdEN1K0I1ckR4TlFlTUE4M0JkOEEwT0pxb21uQmVLbXJTYVI4Y2JLNHZtRHhNa05iaVhSTkp0NTYvRTJCZUp2YldYUm8vSFFzMXphMzB1SnIwRjJXOWNoR29ZWE80M0xmU3RrckZ0Q2JUaFhHbFlwNXNEaG5QN1lCVlphS1hpZzdZUmU3dkxBaXdwRnkrN3VLWU9GelZSSjBlSzFRYllQbWcvZWk4N2pPTXFsaEtnQVNZRHQ0R05XRHFPMmtKcFNlZGI3SlVnT2s1RlRCVk1ZZXN0Yzc0VG9ENVJvZkR4YkpaSjhaVWVmQmFSdU1pNzFGN2wrY1k5emgrUzdFUlpPSCtHTnMwRTFXZ3VZSlZwV0lGR2grbm1kQkxSUWROKzhCejZybGFhd3lIeTljYVhncDlCOEIwRW1vQnBoTWlNTDRHTmMrbHpmRnp5ZDZQN1I0NGpOZFNkeHFuS0puRHBiNE5YZ0hHaEdjeWFtQmJnS1hBTWZFZXphdnlWRlhNSVZQUWtvS3BlclYyUGU4Rk1GK3J1cWRkUXdMQi92OUF6cHVkdFcveXZtVHZ3eUgyU3dVdFFaWXVPc0UyRnpCYUFrMWg4K1NsNlhrZE1pOVZYVGw3cy9TL2N1emxvU3JZZHdDc0tnOTEwdUZZZUdsSTVkTHIwSE93ZlVXZEh6UldNUDdjNHF5bFpKb0V5Uk5zU2UwODRiMVVkSDhYVHlxbUNlaHd0UUJqWXVoaTN0Vk1uMCs3WmQ4Qk1COFhMdzg1SG5yZFZLLzk4Unl0aWZUMStCNkMxb0lNc01sMmlXbzJ0VnpVWTA4TTlaNktBZVBCOXlCNEFpdGtQZEQ4dk1BWWFDK0hmalc4cFdBNkFkd2pZTlVhVERkODlMcjV2WDdkRGhvbktaYnNQaUg2NStpZVE0c0NET2hEUnZQRW1PTTZTRHA0RHBlRHA0UHBpY2hrM0pxM0FOUDFtTzZjSmJBY3J1OEVXQ29QT1I1ZXhtK1A3Y2FjeGxqemZEeG5LdXYxL1FtMHhjRkZtMUl1OHRpOUJaWERwYWF6VytWcEp0TnpPRnhUVkl6UU9HanVDbGtxRVgwU3VEZkEwcnJVZHhBM3grL1Z1S1FZQUtjeHFOYk5taGU3NCt2dkdPZmNIc0RpU3NZS01rMElQMjRCbHdEemdWVHZBY2JQNjNtbUFxYVFKZENTSi9XcTRPSjU3aFV3WDQrK0g3OUg0LzJBQVpwVXNqTU9TY1UwVmdyWDd2aTZBa2JUenl6R2ZrTTI4YTU2Q3pRSHpBY0ltQThZemMvaFhwMUxnNmRyQW9kTm42c0FTNVBFUFFOR3lGekJGQzY2Ny9EeXZNRGgzQngzOWt0aDBkajhPTFk2VGdyYm91Q2l6Vm1UK1l5U1BMM20xbEt6a3lUR0tWd09taWF2QmsrL1g5Vk1ZZFBIK3A3V092RzdBS1pyTU9BVU1QMGhBTStya0JFS1FrWVY0NWp3ZVozNFVtVlM1ZEZpYkNwa3RCWk1GVng2bk5RZ0tvUjlWci9YQXpCRnlSUTA5VGRwZWF4QWZWY0ZTMnN3OXAyQVBXRTQ3MCtNNzFrcVpEc01hN0VIak1GN2xkZFN1Vm5DdGFSMTJSVEkwb1U2Uko1WWZ1eTJ0MWFmcjBEamNZSTV3YzN2Y1RWU3lONHhCcXRTcmtsMjU0QjVuLzBmeVQ3SmU5aUhQWVl5a0lCcG4xejlYTDFTakNmSDQxWnNDbVF0bXdwVk1nV3RsOHhwVmt0ZzBSeGlCYTZDVDE5WDYvVU53TGNBVE5XTGdEbGsyZzlWTEFXc1VxNEVHRzF1YnQyVW5Rdlp0VzNPWUR0ZytyeERtTjQvQ1M3Z0JEQWVWNERwV29ZSmVtdUFBWWUrcC9Md2orQ2NMQWdPRldlSEFiQTNET05RcmJ1cVNYUFJkZ3VRWFhwd1c3TmlPazVCWjlMdzlYM1lqZlgzNnd5OU5NQ0FVOEFVcWovbG1OZVIrc0p4STJEZHRkWTkyaFRJV3JONVVvSXBWb0hWQXk0cFVsSWxJTU9sNmxJZHQvb0dER1dVV3dVWVozY0hUQlAybGdIVDhwQVRBbzk5UGVZcXh0YkhpM0hyYmpESit4ZHJVeUJUUzRPUWpxdmsxK1QxbWQrVG04SGlkMVFPYS8yN0hzeTFYUEhTeFVzWWxqcFRndXdRK3hyc1hnQ2o4M25kOEdEc3VNNWxET2xwNDBrM3BIekRxY3F6UmRrY3lQUUNXMG1mQnNndGdaQkFBMDRIbWNGS3gycisvVnR6WFh6ck1kMEQvaTdmVzUzTFFYWUZTNXNjQ3RsU0FOTzFtRzdiQStOWUtFQnZEVS9nT1dBalc4cjJQU0NRN2ZmN3RNNzQvYkswbGZzTWxDeXAxcFJTemMram5rQ2JBdGVqdGVvYWJOb0d3M20wZnkyWVhjRjhEYllVd1A3Q0dEQmRoM0Z5QWs1anhMNmxuN1A1cjJ3VU1zK3RSVnVsWk9uQ2ZGYnhoRStnZWVLejFWbS9LdFZVTVNyQTBxeEhjMlh4alFkVmx5ZlV3ZGJ2bTZwaUNySW5MUlAyNytNeDRWb0tZTDZieU92V0dIR3JYc0hTSDE4bjJKS2lWYm0wS0d1VmkrbmlkQ0QzOXJnQ1RhMEhXQVZhQXF3cU1XdnlWQ2NBQUJDYlNVUkJWUHc4YVYya3l2SjhiRFhRcm1CVU1RZGErMGtBT0xON2lVaDNCVk1WV3dKZ3JtQ2NQUGNZbDRXdkdNNnJmZU94UXFjL2NmTzFXc3JCUmRuY05Wa0NLNmxLcFRBT21KZHlEaHBOejdrclhNK1pJUFBkUFUwb0Q3RDJtZjN4MlJWb3E1akM3T3V3djRNdkNiQkhuQ3FZbG9ZT0ZyMEN6ZFdzeWg4QVdOUjZET2hENW1CcHNyZEFxd0JqbTJDYm8yUTl5QlEwQXF5QXZlQ1FOR2tHVllBZWp1L1pIdC9UZ2l3cFptOGRwbkF4cVpjQVdLVmdDYkFwZndHTW9MWGl1U2l3MUhxUTBUelJLOENtREpEUC9KVS95SGNBd3ptMUpQSGRLWjZYU2NuemFPTHJRdHhuVHdlTWZlUjUrUDAwQjdtbFluL2hGREo5YmttQVRWR3c5QmZBL0IrRXNwOVZ1ZWo1czBqUWVtc3l0dTZWcWlUd2RMQlNlZVVKcXFybWFxYm5jdEFjRmdYZ3gvRzFKL3VzQnhRWUs5TVdBNHg2amJTa2xta3Q1aXIyRjJyQVBKbUIyd01NR0FQR2pRMVhyL1MzTExXZlhpcDZERThVYkdtbElwQWgwMlR6V2FRRldISWRMSm9tTVZWR0FWTWwwM1dabnRQaDBpRHBnbHhoZnNScG4xdUFNUkc5bEZHSUllOVh5RFI1azVJNVhLcGdPdEVBdHdrWSs4VGRRd1dNL2FuK1h3SHZwMjU4cE1rNndyWWsrMGk1eUhZbkxkMEhTcE9TNXVzWVZiR2taanJRRHRtcitTT0c4ek1ocURRK1FmZ0VVSzJ0cGtMRzk3Y2c2eVh6RWdCVEJTTmtxbUN0LzdpajJ2VG9sWXA3WUprcUJoaGtka1BhTDdLblpHL1dwZ0ZMNWFJRDVxQ3BvdW81Q2RZTHh2ZTUzbkNxaHFwbUo4SER1RTg4L3hQeVRLdVFKVEI5OTFLVDkwOTdUUFh5ZTA3QTdRUFdLaEY3LysxVWIxZlJKK2JGQWdiTVZ6S0Z6QUZMN3FBQnArc1lWdzRGamQraDUwOUs5b0loS1Fnb2syTjdPRzBFRFRpRmhkL3pDNGRrYzhnU25KckVmaDlPMVV5VFdEYzQyR2RPY0E2WTNtLzZhc0M4UkV4dzhmOTNTenVLUFJWTEUvdWlyUWRacFdCVElGTlY4NW1wVWpJRlJkVXNsWXdKc0FTWnFwUmJVaU9DOGhORDRqSVowb1RCODJqLzA3MDR0bnhORTNtcGdQVVVURUZUdUZURnZPcHgwQmF0WWtBTm1TYVJ6eXBNQWswR3Rqb3p2ZHJyVlptbGlaQkFZM0w3K1htT0JKa0N1c0g0bkdxdXFnNVpsUXpWZFdnL3FGVGV1bnF4ajhEcEJFS0FDRlFxdTI0Sk1GZXczanJzN2dFREFtU2RkWmtyV1ZJd25mbDlJSFhBbU55dVl1cXZ4L2Q0S2FHUXVScXFpaWxrQ00rcHlqbGthYzJ3Z3lRQVRpRnpOV1A3aFBGMWFSOXA3eGpHckZxRFhSdXdwS3BwazJQS2YvOWJsWWdLbVk3dFhRQUc5TXRGTlFkdEo2NXd2ZHBqSDh3SDg1VGNya29PbWM3NDIrTm5ITEtrWk9vczBiUWYzaGVkUEx3UENKOVgySDNDU0FvTG5GNlBLdGhYQUtiVnl4VEFxdkxRNGFvbXJRVFlYY0JGbXdLWkt4a0gzd0ZUc0h6R3FwTFVrMU5WZ0x1R1NRMjlaSFN3S3NDQU1WeXVhRnNjenUvcTdDVU5UWUZOb0czdFdKVlV4MVFWTEFIMlM5cGZPQzI1YUo4QkdEQVBNRld4dE5HaEUwSUNUUE1MYk85RnhZQTJaRHBiTzJpcVpFeVExK0NwUEhBQWtwcTlTcXRKNzJyMmhsTlYxRVRXODZodGo2MitoNS9mWVZCUFRZWWRUaE5DcjBIVnNBVTk1RHQwL0J3d1Y3RnFUYlBIQVBvY3dGbzdtKzhZcTZydUlyYkt4RXJGV29EcE11THVBQU1LeUdhc3kzUzJWN0M4UE5BQjVxRDJJUHNwbi9QUE1ya1NhQnM3cG1rZzk4aHFwN0M4QjFmQWFQcTU1UHI5d05CdlZXSW1zeXFHUXNibkZUQWR4NDhBcHI4dVVjQmFDa2JBcWpVWUFlTzFNQThjcm04REdEQ3RYS1FsRmFNbndCdzJ3cUtCVFpBNWFBcVpxb24yNVJXbnllN3E1WjlqR2VkcVIvZzBDZHpWSEZJL3B1bjVGVERmNUZBVnEzYmxLc0M0aTBuQS9PWjNBdXdCQitzQlZxM0JGREQyMVNjRXJVUjBncng3d0lBK1pENzdwd1JQNVNJVEp5MTZmZkd2aWJMRDZZYURRK2Fxb3YxNFJqWU5xcXNUUVZNb2t2cU1Fa0xlcCsvMzUvaCtQYStQbDVlSTdncVlWd0tjb0FnWVFTSlkvdnZJSG1CelMwUjlYZnVjU3NSdnAyQzBFckpHeWVocTVpV2pBL2FNNFo2VDdyUzExQ3lCNXJXOGcvT0dnMm5DSTd4dkorM2pzVlhRSERhYUsyUHYrV29pU09PVUlOT1NTNVVBR01aTXg4c0I4dzJPS1lETlVUQy9GK1lLcG9DbHlSRnM3eGt3b0s5a2JnNmJncGJLeFdkN3pESlFJV1BMcE5IdjFjUk1rR25wdEVPMk5ERlFNUWtZM1RkT0hGZzFuWUM4VFJOU1VqQk5hZ1V0cldkY3dhbzFtRHRmL3d6QS9pZlA2eTdpQ2xqRHBrQldKWTlEb0tYaXMvZ3ZuUDdhZ1Z2R210Q3VaZzZZQjBvRFZvR21pWjRTL2czamUxZ09tcS9YS3VDQURGY0ZtS3VZZ3NibnZkUUN4cVcxQXBiZ09nY3dRdFRiUVp5Nml4amo5aDBBQXpxUUZTWGpPdzdCOWlUcUpaQkN4b0JYb0QzS2R6c2thVmFFUEtlZ3NiOTgzdnVxOTRuT0FXME9ZSnJVT2s0S0Z4T1Yzd1BjQm1DcVlHbk51QUlXYklxU0FVTXlleklsTldQUW5qQUdqYzlwUXFkdDlLMTlmNEp0RkRBeEJjcVRQa0gyaW5HZnFMQStBYlJBYXdIV1VySGtmQSt2bDllbmdIR3lTbXN3cnNQT0JVemhhcFdJWHRhdWdBWHJRdFpRc3dmVXM3VUc3MG44RVdQbFNHc2dMUnVmNUh5YXhBbXdEUTU5MEQ2K1lmeTVwTG9Kc3BhYXVaSWx5SGJpYVd5MDViR1h4bnVNSng2T1Iyc041aHNkNXdEVyt5V0hsN1VyWUlWMUlRdFd6ZHFxWkk4WWxNdExSUy9QVk0yMC9XSG4wdFpOazErVDFPSDBwSC9FMEY4dkYxTTUyNEtNNTFMMXJjckZOenVtczU5QW5uQlV3WG83aVo4RjJEOFlOa0txRXBIWHFUbXhBbmEwT1pEcEFHbGk3WEFJcEplTWp6Z0U1TEh3bGxvd01UeFFQY0EyR0pkYkhteE4vdTN4dlQrQ3Q4cEZQWi8zTFNtWmdzYng4Wm0vS2c4ZHNLUmdmRXlGODdFRnpnTnM2aHBzQmF5d1NaQlp5UWdNQ2JYQk9LbGVjUWp1QzRhRVRYQlZpc0Z6OEpqck13WE1nNldKejg4Uk5PQlVZZGpmTFE0Sm9zbGNyY2ZtUXFaajhvNGhFUk5ZcWw3QWNENk9VYVZnMmxZL2xXSy9FbUI2bitzekFOdmhkRHkrUFdEQVJNakVkTEI4NW43RElUbW9EZ1J0Q21RcGlRbE42cU1xbDcrZi9ucDhUbFVpd2NiM2I2M3RBVVp6eUh4Y1V1c3pQakQwbjhBbkJVdUFwUnZOT2dtY0M1aHZjamhnT3I2cXhpdGdSNXNNV2FGbUhGZ21NMkY3d1ZnaEtxL0tNbUJJbGdvMElNUGxyc21nUURBNTBuZHNRcXRncXpHSkZCcUh6YUZ5dURZNEhTOVZNQzBUZGUyVlNzUVZzQnV6eVpDSjZjQXBaQ3lMT0JzVHRCNWdDVEpOL0FxMENxNnRPUlBqQWFlcXhqS04vVmVRK1AzNkdOTFNOTEdtT0UzUG9ZQTlJaXVZd3FYbFlRSk1xd3NDUm1qOGx4d3R3TGlMMk5xbVh3SHIyQ3pJT21xMnd5SElCQzBsZlBJS01PRFF2d1RheG56Sythb0VTUUFBR1NvSGpMYnZ0R282ZVdqL3RLUm1DYWhRSmZVaVlQdytZQVhzNW13V1pHSTZpQXFhQnJpWDlBUk1RVlBBYUFrMGg4c2hjOVZzbFRxcGxBUEcxempIWEszWXBnbEIrNmdLcGlyMjAxeHZoZkI2YVJ4L1hpczNMRmJBdnRCbVF5WnFwb1BMc290cTlvQmhKbTJwak1MbFNxYXdPV2hKeVNyQW1KQU8ya2RnYXlXUUsxOENLd0hHL2psZ1A4T3hsNGNjQzYwbVd0djBDYTRWc0F2YmJNZ0FlTm5vc0JFMEpwZUMxdktrWWhvMFFxVHZTMG5zc0drWjFnSk5ZVXRKMUV1Z0JKY3JWNW9JQ0k1RHBpMWY1MmQwSE5oWFhrOHFFVmZBdnRBK0JKbVlEcXh1SWlob3FqNFZXT3FRbHJiSElkRlFmTDVTQ1lmc0NRTm9iK1k5Vld1QmxxRHZBZWI5U3JCcGFhanE5WEE4bndLV0ZNeExSQVd0K3FuVUN0Z24yNGNoQzJVak1BU0JvRDFndUYrbFNaZmdTbUFsWjUvMU95SEhudEFPMkJOTzFZeko5SVpCalQycGVwQ2xTVVhYbllTRXdEeWFQMW5yY0dsNUNCejZ3ajYvWWRocVY4QVVzaW0vUlZ3QnU0QjlHRElBWGpZQ1F5SVN0TGZqOHoyNEhEQ2dob3pPcEFPeXFqbGtyeGdEMWxPelpuS0piYVRWODd1SzlTRFQ1MVdKRmE0Tmh1dFh3RjV3dXNtUlZHd0Y3QXZzTE1qRWRMQzFiTnhnV0l4UEJheUNLcFZ4bm9ENk9KVm5DbGFsWkMzSUhEUUhyQWVaZXdzc0xRMTVIdmFGZmExS3hBVFl2OUlTcmhXd0s5alprSFhLUnRvR2g0VFF4MG05Z0ZPd0hEQTZOd0pTS2FVSnVzTTR5VlVCSEM3MUJMV0NSdk1KSTVXS3JtWU8xQlM0RkRBcXNRT1cxbUVLVndLczljOVZWc0Erd2M2R0RJQ1hqWm9Rd0tCbVBLNFVERGhOWmlhNXFvc21BY3VzcEdxYTlOdmpad2ladWdPbTUwdUE5U0J6TlhQWUZDWjM3ejh3aHNzQjQ0OTJIYkRVYW5ub1AvWmRBYnVnZlFwa1luc2Nrb09CVURVRGF2V2lPVnpxQ1lpZngxYkxMVlVCVC94M0hKSTV3ZXR3blFOWkM3VFVhbjlwUHNubytpc3BtTjRQUytwRndQeTNpQ3RnRjdaUGc2d29HNEd4cXJVc0piT3JsNm9QWFVHaldxWGsxZVRuZDIvbE9NSGxrRUZhMmtiYUJKa0Q1ODhudVB6YXVmNTZ4WGdYMGN2RTVLNWVLMkJYdGsrRERDaEJtd3VZcTFjQ0szbTZwK1FsR09SWWdkTnpKOWpuUU1aakJ6d0JUMHZYNytWaEN6Q0Y3RDlwVTNtb04rUjFmRmZBTG1TZkNobndZZEJTUXJjZ2V3M3V2K3Q3UkwzZVFXajN4L2Z3dUFLcmdreVBIYVIwWHFBTmwxNHJ5ME8vRithUTZlTmZxQUZMNjlBVnNBdlpwME1HZkFpMFZySk5nWXpKNDcrVThGMjhxb1FFeHNtdjRLbFZDWmMrV3ozbU9PaTE2alg3TmZvYVRGVXN3ZVp3cFg4TFJzaThQRjRCdTRCZEJESmdCQm93QkMrQmxoUXNsWXdWWkM4NC9GcjlCZldQYVpPcStib0lhQU95RDYrcitXdWFzSDZzeXBFbUVwMDRucEZWTExVSkxsOS9yWUJkMlM0R21SaVRzd0xOSVhQZ1dwRHBqVlQrMDVBWFpFVWphSzVxVTlWdGpqbFVhUkpob2pQcDArVGhaYUt2eHhKWVBmVmFBYnV5WFJReUt4c1RhQnBnZlZ5VmpKNk1EdGt6VHRXc0JackRwc3Ftc0FIVGdLdmdVdVh5aWFNRldGcUxLV2o2UE4rcmNMWEt3eFd3SzlsRklRTk9RRk43UjcwSlVNSFdVekwvZDFqK285c2Y1Z20wcEd4QUg3SVdZRlg1bXdCekZhdEE4OWRhY0ttQ0tmUXJZRmV3aTBNR0RNRnJ3TllDekJXTlNlbXdKY0Q4bjR0TVZUUUZEY2pLcG5ZdVlMNE9jeVZMd09sNytCbjlQb2ZMMVVzaFd3RzdvRjBGTWxxaGFudmtUWU1LdHJRMjR6OWplY2JwdjhmcVFhWnJ0R3BUSktsWnVvN1U3ejFPMTErdXltOFlLOUZMeHhWSVZ5OHZyeXU0OXNBSzF6WHNxcEFCSldoQVRvUkt6YnpNZXNGcGFaZ0FxMHJHSHppRkxHMkdURlV5TGN2WWQ0WHN6ZHhoY1ZXcm9QS3lVTmRlcVR3RVZzQ3VibGVIREdpQ0J2UmhZd0w5d0pCWWp6Z2tvVUtXMUN2ZE8vT1NVVzljVDFtYmVmSzIrdXdxNW1xV0lIb05yK3RuK1gwS2x2cEl1ZGl1Z0YzUE5sODkxbkl2elJQWkUxMGhvQ3NzQ3BBRDFWS3dyZm01U3VZcTFsTGk1SzlGbThEeWtuQ0hjUi9jQWF5QVhkdStIRExnQkRTMjdwcjhEcHhDNDhkVDRVcWJIeCtCckFMTklWTlFLdUIyZHV5cTVjcmw1NGM4dDhMMVJYWVRrQUVqMElCVFZYUFFWTmxjM1J5OEZsUXR3Qkpra0phMnQ5YVRQWUhHWTRYSG9VdFF1bW9wekpWeXJZQjlzZDBNWkxTR3FnSGp4RTlRYkVQcklGWEhEcGREQm1uZFhEVWNNaDd2UXBzZ2FrSGwzOW1FQzFnQisycTdPY2lBcUdwc2t5c1VVOER6NStjQU5oZXlCRnFDeHVIejQvUTlGVmdyWERkbU53a1piU1pzQ2JnV2ZPazkvajE2UGtqcjV1cmhrRGx3RlhqVjZ4Vlk2YndyWERkbU53MFpiY0o2VFk4VExFbWhLckRVL1J4OHJLWURtQ0J6VC9Ba2tDcW9TcmlBRmJCYnRFVkFSZ3ZyTlI0N0VEMVBRQ1dIdEg2czFnSk5qeXQ0ZWtDbDcrVGp3OEdTQXZuTmJGR1FBWEJWQTA1aFNORHBjUXVtQkZkMVBsb2F3QjVvUFlpcXoydDdlTEMwQUg1RFd4eGthc1dhVFk4ckFIdGdha3Z6eDhsOE1GdXc5WTYxSFIydllDM0xGZzBacmFGdTFYRUxxQW95TmI3V0c3d1dMTDNXajFlNEZtcDNBWmxhQnpoL1hCMm54eCt4Q3BnU0pIKzhnclY4dXp2STFBSndRSVpuNm5OekxBM3NwT2RXc083TDdob3l0d0k2NEh5Z3Bsb2M3QldxKzdadkJabGJBN3FMMmdyVjk3SnZEVm5QUGdyaEN0RnFhaXRrcTYxMllYdm92V0cxMVZZN3ovNGZBdWYzVCtSK3BBVUFBQUFBU1VWT1JLNUNZSUk9Ii8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNMTMxLjU5LDEuM2M5LjE2LS44NCwxOC45LS44NSwyNy4yLDMuNjcsMTQuMzksNi4yNiwyNC43NywyMC40OCwyNi43OSwzNiwuMjMsNi40MS43LDEzLjA3LTEuNDcsMTkuMjRhNTUuMTQsNTUuMTQsMCwwLDEtNS44NiwxMi42OWMtMy4wNyw0LjkyLTcuNjUsOC41OC0xMS41OSwxMi43NHEtMzYuODEsMzYuNzYtNzMuNTUsNzMuNjFjLTQuNjcsNC42NS05LjI5LDkuNzEtMTUuNjMsMTIuMDUtNSwyLjM1LTEwLjYyLDIuNDgtMTYuMDcsMi4yMUM0OCwxNzIuNCwzNi4yNSwxNjIsMzIuOSwxNDkuMTJjLTMuMTQtMTAuOTEuMjUtMjMuMDYsNy43Ny0zMS4zOVE1OS40LDk5LDc4LjA3LDgwLjI5YzIuMTktMi4zNyw2LTMuNDksOC45LTEuODMsMy44NywxLjksNSw3LjkyLDEuODIsMTAuOTFDNzYuMTYsMTAyLjI1LDYzLDExNC42Myw1MC42OCwxMjcuNzhjLTQuNjMsNC43MS01LjkxLDExLjk0LTQuMzUsMTguMiwyLjI4LDYuNTQsOCwxMi4yNCwxNS4wNiwxMy4xMiwzLjc1LjM1LDcuNjguMzEsMTEuMi0xLjIsMy45NC0xLjU5LDYuNjktNSw5LjYyLTcuODcsMjYuNTgtMjYuNDIsNTIuNzktNTMuMTgsNzkuMzgtNzkuNTdhMzIuNTIsMzIuNTIsMCwwLDAsMTAuMTctMjEuMUMxNzMsMzIuNjIsMTU5LjMsMTUuNjksMTQyLjE0LDE1LjE5YTMxLjgsMzEuOCwwLDAsMC0yNC44Myw4LjQ2Qzg4Ljc0LDUyLDYwLjYxLDgwLjc2LDMyLjA1LDEwOS4xMSwyNS4yOCwxMTUuNzksMjEuNDEsMTI1LDIwLDEzNC4yN2MtMi4yNSwxNS45LDQuNjcsMzIuODYsMTcuNzIsNDIuMzJhNDUuMSw0NS4xLDAsMCwwLDI5LjYyLDkuMzJjMTIuNjQtLjUxLDI0LjQ2LTcsMzIuOTMtMTYuMThDMTEwLjU1LDE1OS4zLDEyMSwxNDksMTMxLjI5LDEzOC41NWMxLjY1LTEuNjQsMy4xOC0zLjUxLDUuMzEtNC41NGExMC42MywxMC42MywwLDAsMSw2LjYyLjI1YzIuNjEsMS4wNywzLjUsNC4xNywzLjQxLDYuNzYtLjMxLDIuNi0yLjIxLDQuNTktNCw2LjMycS02LjQyLDYuMjEtMTIuNTUsMTIuNjhjLTguNTgsNy45NS0xNi42MSwxNi40Ny0yNSwyNC42M2E1OCw1OCwwLDAsMS0zMy44OSwxNC45M2MtOS40MiwxLjMtMTktLjU4LTI3Ljg4LTMuNjVBNDguNDgsNDguNDgsMCwwLDEsMzMsMTkwLjQ3QzI1LDE4NS43NSwxOC44NSwxNzguNTcsMTMuODEsMTcxYy01LjI2LTkuMzUtOC42NS0yMC04LjMzLTMwLjgtLjI1LTEwLjc3LDMuMjEtMjEuMzEsOC41My0zMC41Nyw0Ljg3LTguMDcsMTItMTQuMzgsMTguNTUtMjFDNTcsNjQsODEuODIsMzkuNzUsMTA2LjIxLDE1LjA5QTQ1LjI2LDQ1LjI2LDAsMCwxLDEzMS41OSwxLjNaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg5IDE0KSIvPjwvc3ZnPg==';

const axios = require('axios').default;
let config = {
    baseURL: 'https://data.codingclip.com/',
    timeout: 10000,
    withCredentials: true,
    headers: {'Content-Type': 'application/json;charset=utf-8', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36'}
}
class HTTPIO {
    constructor(runtime) {
        this.runtime = runtime;
    }
    static get STATE_KEY() {
        return 'Clip.HTTPIO';
    }
    getInfo() {
        return {
            id: "httpio",
            name: formatMessage({
                id: "httpio",
                default: "HTTPIO",
                description: "HTTPIO Extension"
            }),
            menuIconURI: menuIconURI,
            blockIconURI: blockIconURI,
            blocks: [
            {
                opcode: 'setUA',
                text: formatMessage({
                    id: 'setUA',
                    default: 'set UA to [UA]',
                    description: 'http set useragent'
                }),
                blockType: BlockType.COMMAND,
                arguments: {
                    UA: {
                        type: ArgumentType.STRING,
                        defaultValue: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36"
                    }
                }
            },
            {
                opcode: 'httpGet',
                text: formatMessage({
                    id: 'httpGet',
                    default: 'get [URL]',
                    description: 'http get'
                }),
                blockType: BlockType.REPORTER,
                arguments: {
                    URL: {
                        type: ArgumentType.STRING,
                        defaultValue: "https://www.example.com?value=114514"
                    }
                }
            },
            {
                opcode: 'httpPost',
                text: formatMessage({
                    id: 'httpPost',
                    default: 'post [URL] with prefix variable [PREFIX]',
                    description: 'http post'
                }),
                blockType: BlockType.REPORTER,
                arguments: {
                    URL: {
                        type: ArgumentType.STRING,
                        defaultValue: "https://www.example.com"
                    },
                    PREFIX: {
                            type: ArgumentType.STRING,
                            defaultValue: "SuperCowPower."
                        }
                }
            }]
        }
    }
    httpGet(args){
        return new Promise(function (resolve, reject) {
            axios.get(args.URL, config).then(function (res) {
                console.log(res.data);//Debug
                if (typeof(res.data) == "object") resolve(JSON.stringify(res.data));
                else resolve(res.data);
            }).catch(function (err){
                console.log(err);//debug
                reject("Something went wrong");
            });
        });
    }
    httpPost(args){
        let postData = new Object();
        const oc = new ObjectToArrayUtil();
        const editingTarget = this.runtime.getEditingTarget();
        const varList = oc.objOfPropertyToArr(editingTarget.variables);
        for(var i = 0; i<varList.length(); i++) {
            if(editingTarget.variables[varList[i]].name.indexOf(args.PREFIX) == "1"){
                postData[editingTarget.variables[varList[i]].name.substring(args.PREFIX.length())] = editingTarget.variables[varList[i]].value;
            }
        }
        return new Promise(function (resolve, reject) {
            axios.post(args.URL, postData, config).then(function (res) {
                if (typeof(res.data) == "object") resolve(JSON.stringify(res.data));
                else resolve(res.data);
            });
        });
    }
    setUA(args){
        console.log(config.headers);//debug
        config.headers['User-Agent'] = args.UA;
    }
}
module.exports = HTTPIO;