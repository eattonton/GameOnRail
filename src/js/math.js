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

//两直线段是否相交
function SegmentsIntersect(A, B, C, D) {  
    // 计算向量  
    let ABx = B[0] - A[0], ABy = B[1] - A[1];  
    let CDx = D[0] - C[0], CDy = D[1] - C[1];  
  
    // 计算叉乘，判断是否平行  
    let cross = ABx * CDy - ABy * CDx;  
    if (cross === 0) {  
        // 平行或共线
        return false;  
    }  
  
    // 使用向量叉乘和点积判断交点是否在线段上  
    let t = (D[0] - A[0]) * ABy - (D[1] - A[1]) * ABx;  
    let u = CDx * ABy - CDy * ABx;  
  
    // 如果t和u在0到1之间（包括0和1），则交点在线段上  
    if (t * u < 0) {  
        return false;  
    }  
  
    let tDiv = t / cross;  
    let uDiv = u / cross;  
  
    // 检查交点是否在线段上  
    return (tDiv >= 0 && tDiv <= 1) && (uDiv >= 0 && uDiv <= 1);  
}  
   
export {
    RandomInt,
    GetRandQueueInRange,
    GetRandQueue,
    SegmentsIntersect
}