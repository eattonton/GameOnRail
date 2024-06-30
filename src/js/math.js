//生成随机值
function RandomInt(min, max) {
    var span = max - min + 1;
    var result = Math.floor(Math.random() * span + min);
    return result;
}

//在范围内，生成一定数量不重复的随机数
function GetRandQueueInRange(n, min, max) {
    let arr = [];
    let flagUnique = true;  //是否需要唯一
    if(n>=(max-min)){
        flagUnique = false;
    }
    // 在此处补全代码
    for (let i = 0; i < n; i++) {
        let num1 = RandomInt(min, max);
        if(flagUnique){
            if (arr.indexOf(num1) == -1) { //去除重复项
                arr.push(num1);
            }else {
                i--;
            }
        }else{
            arr.push(num1);
        }
    }
    return arr;
}

//生成随机队列
function GetRandQueue(array, size) {
    if (!array) {
        array = new Array();
        for (let i = 0; i < size; i++) {
            array[i] = i;
        }
    }
    let res = [], random1;
    let array2 = [...array];
    while (array2.length > 0 && res.length <= size) {
        random1 = Math.floor(Math.random() * array2.length);
        res.push(array2[random1]);
        array2.splice(random1, 1);
    }
    return res;
}

export {
    RandomInt,
    GetRandQueueInRange,
    GetRandQueue
}