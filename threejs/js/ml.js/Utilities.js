/*****************************************************************************
 *
 *    Utilities Module
 *   
 ****************************************************************************/
debug("Loading Module: Utilities");

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function bengioInit(n, m){
    return Math.sqrt(6) / (Math.sqrt(n+m));
}

function getRMSE(mat){
    return Math.sqrt(mat.clone().pow(2).average());
}

function range(n){
    var ran = [];
    for (var i=0; i < n; i++){
        ran.push(i);
    }
    return ran;
}

function shuffle(arr){
  var tmp, rand;
  for(var i =0; i < arr.length; i++){
    rand = Math.floor(Math.random() * arr.length);
    tmp = arr[i]; 
    arr[i] = arr[rand]; 
    arr[rand] =tmp;
  }
}

function sizeOf(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function getMaxPosition(col){
    var max = 0;
    var index = 0;
    for(var i=0; i < col.length; i++){
        if(col[i] > max){
            max = col[i];
            index = i;
        }
    }
    return index;
}

// Insert Float64Array with activations and class dictionary here.
function getLabels(resultArr, classDict){
    var m = classDict.length;
    var n = resultArr.length/m;
    var index = 0;
    var subarr = null;
    var labels = [];
    for(var i=0; i < n; i++){
        subarr = resultArr.subarray(i*m, (i+1)*m);
        index = getMaxPosition(subarr);
        labels.push(classDict[index]);
    }
    return labels;
}