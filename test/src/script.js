var actualPut = "user";
function executeChangerWatcher(){
    var elem = document.getElementById("elem");
    var observer = new MutationObserver(putChangedClass);
    observer.observe(elem,{subtree:true,characterDataOldValue:true,childList:true})
}
executeChangerWatcher();
/**
 * @param {MutationRecord[]} data 
 */
function putChangedClass(data){
    for(const record of data){
        for(const node of record.addedNodes){
            addTag(node,"green");
        }
        if(record.removedNodes.length > 0)
            addTag(record.target,"red");
        if(record.oldValue){
            addTag(record.target,"yellow");
        }
    }
}
/**@param {TransitionEvent} ev */
function removeTag(ev){
    setTimeout(()=>{
        if(ev.target)
            ev.target.className = "";
    },200);
}
function cancel(ev){
    ev.target.className = "";
}
function addTag(node,className){
    var selected = node.className === undefined ? node.parentElement : node;
    setTimeout(()=>{
        if(selected)
            selected.className = className;
        setTimeout(()=>{
            if(selected)
            selected.className = "";
        },500)
    },0)
}
/**
 * @param {"set"|"read"|"action"} type 
 * @param {string} text 
 */
function putInDetails(type,text,sub = {},ref){
    /**@type {Element} */
    var actualDetail = null;
    if(!actualDetail || !actualDetail.getElementsByTagName("summary")[0].innerText != actualPut){
        createDetail(actualPut);
    };

    function createDetail(name){
        var details = document.createElement("details");
        var summary = document.createElement("summary");
        summary.$innerText = name;
        details.append(details);
        document.getElementById("zones").append(details);
        actualDetail = details;
    };
    function info(){

    };
}