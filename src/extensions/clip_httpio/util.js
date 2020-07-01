class util {
    static objOfPropertyToArr(object) {
        let array = [];
        let i = 0;
        for (var item in object) {
            array[i] = item;
            i++;
        }
        return array;
        }
       
        static objOfValueToArr(object) {
            let array= [];
            let i = 0;
            for (var item in object) {
                array[i] = object[item];
                i++;
            }
            return array;
        }

}

module.exports = util;
