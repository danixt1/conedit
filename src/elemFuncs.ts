import * as tags from "./tags.js"; 
interface DataPosition{
    node:Node,
    localPosition:number,
    index:number
}
interface NodePosition{
    node: Node
    localPos: number
    startIn: number
    index: number
}
interface locationResults{
    start: NodePosition;
    end: NodePosition;
    elems: Node[];
}
/**
 * Get informations from what is in the position
 */
function getDataFromPosition(elem:Node,position:number):DataPosition{
    var node:Node = null;
    var actualPos = 0;
    var localPos = 0;
    var actualNodePos = 0;
    moveInEveryNode(elem,el =>{
        actualPos += el.textContent.length;
        if(actualPos >= position){
            localPos = el.textContent.length - (actualPos - position);
            node = el;
            return false;
        }
        actualNodePos++;
    });
    return {
        node,
        localPosition:localPos,
        index:actualNodePos
    };
}
function splitElem(elem:Node,pos:number){
    var elem1 = elem.cloneNode(true);
    var elem2 = elem.cloneNode(true);
    function defOperation(actualElem,moveIn,substring){
        var cutIn;
        var actualPos = 0;
        var removeTexts = [];
        var removeClearElems = [];
        moveInEveryNode(actualElem,e=>{
            actualPos += e.textContent.length;
            if(actualPos >= pos){
                cutIn = e;
                var textPos =e.textContent.length - (actualPos - pos);
                cutIn.textContent=substring(cutIn,textPos);
                return false;
            }
        });
        moveInEveryNode(actualElem,e=>{
            if(e === cutIn){
                return false;
            };
            removeTexts.push(e);
        },moveIn);

        for(const e of removeTexts){
            e.remove();
        };
        return actualElem;
    }
    return [
        defOperation(elem1,"end",(el,textPos)=>el.textContent.substring(0,textPos)),
        defOperation(elem2,"start",(el,textPos)=>el.textContent.substring(textPos))
    ]
}
function getLocalPath(elem:Element,from:number | Element):Element[]{
    var endElem:Element = typeof from === "number" ? getElemFromPosition(from) : from;
    var sequence:Element[] = [endElem];
    var actualElem = endElem.parentElement;
    while(actualElem != elem){
        sequence.push(actualElem);
        actualElem = actualElem.parentElement;
    };
    return sequence.reverse();
    function getElemFromPosition(pos:number){
        var node = getDataFromPosition(elem,pos).node;
        return node instanceof Element ? node : node.parentElement;
    }
}
function buildElemPath(elems:Element[],insert:Node){
    var elemsCopy:Array<Node | Element> = elems.map(elem=>{
        var clonedElem = elem.cloneNode(false)
        clonedElem[tags.markFormat] = elem[tags.markFormat];
        return clonedElem;
    });
    elemsCopy.push(insert);
    elemsCopy.reduce((prev,current) =>{
        return prev.appendChild(current);
    });
    return elemsCopy[0];
}
const getCaretPosition =function(){
    var lastPosition = null,lastNode:Node = null,lastTruePosition:number;
    function get(elem:Node):number{
        var caretPos = 0,sel:Selection, range:Range,nodeFocused:Node,truePosition =0;
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.rangeCount) {
            range = sel.getRangeAt(0);
            nodeFocused = sel.focusNode;
            caretPos = range.endOffset;
            }
        };
        //Skip the calcs, case nothing have changed and send last position from caret
        if(lastPosition === caretPos && lastNode === nodeFocused){
            return lastTruePosition;
        };
        lastPosition = caretPos;
        lastNode = nodeFocused;

        moveInEveryNode(elem,actualElem =>{
            if(actualElem === nodeFocused){
                truePosition+=caretPos;
                return false;
            };
            
            truePosition += actualElem.textContent.length;
        })
        lastTruePosition = truePosition;
        return truePosition;
    }
    return get;
}()
/**
 * take the deepest node in every element.
 * @param elem The element to look.
 * @param callback callback passed in the nodes pass `false` to stop the loop
 * @param direction the direction to return the nodes
 */
function moveInEveryNode(elem:Node,callback:(node:Node)=>void | false,direction:"start"|"end"="start"){
    var actualNode = elem;
    var lastPositions,plusSignal,logicalMode,startingPos;
    if(direction === "start"){
        plusSignal = 1;
        logicalMode = (actualPos,length) =>actualPos < length;
        startingPos = (length)=>-1;
        lastPositions = [-1];
    }else if(direction === "end"){
        plusSignal = -1;
        logicalMode = (actualPos,length) => actualPos >= 0;
        startingPos = (length)=>length;
        lastPositions = [elem.childNodes.length];
    }
    while(lastPositions.length > 0){
        var actualPos = lastPositions.pop();
        if(actualPos === undefined){
            break;
        };
        actualPos+=plusSignal;
        lastPositions.push(actualPos);
        if(logicalMode(actualPos,actualNode.childNodes.length)){
            actualNode =actualNode.childNodes[actualPos];
            lastPositions.push(startingPos(actualNode.childNodes.length));
        }else{
            lastPositions.pop();
            if(actualNode.childNodes.length > 0){
                actualNode = actualNode.parentNode;
                continue;
            }
            if(elem === actualNode){
                break;
            }
            var ret = callback(actualNode);
            actualNode = actualNode.parentNode;
            if(ret === false){
                break;
            }
        }
    }
}
function setCaretToEnd(elem:Node){
    var end = getEndChild(elem);
    setSelection(end,end.textContent.length);
}
/**
 * Get the absolute last node in the element
 */
function getEndChild(elem:Node):Node{
    return repeat(elem);
    function repeat(elemToSearch:Node){
        var childs = elemToSearch.childNodes;
        if(childs.length > 0){
            return repeat(childs[childs.length-1]);
        }else{
            return elemToSearch;
        }
    }
}
/**
 * Get the absolute first node in the element
 */
function getStartChild(elem:Node){
    var actualChild = elem;
    while(actualChild.childNodes.length >0){
        actualChild = actualChild.childNodes[0];
    };
    return actualChild;
}

function getLocalPosition(ref:Node,data:DataPosition){
    var actualPosition = 0;
    moveInEveryNode(ref,e =>{
        if(e === data.node){
            actualPosition+=data.localPosition;
            return false;
        }else{
            actualPosition+=e.textContent.length;
        }
    });
    return actualPosition;
}
/**
 * Pass Every node
 */
function setCaret(parentNode:Node,pos:number) {
    var actualLength = 0;
    var relativePositionToElem = pos;
    var relativeChildFromPosition =getChildInPosition(parentNode);
    setSelection(relativeChildFromPosition,relativePositionToElem);
    function getChildInPosition(elemToCont){
        if(elemToCont.childNodes.length == 0){
            const textLength = elemToCont.textContent.length;
            actualLength +=textLength;
            if(relativePositionToElem > textLength){
                relativePositionToElem -=textLength;
            }
        };
        if(actualLength >= pos){
            return elemToCont;
        }
        for(const actualChild of elemToCont.childNodes){
            var res =getChildInPosition(actualChild);
            if(res)
                return res;
        }
    };
}
function replace(elem:Node, searchValue:string | RegExp,replaceValue:string | Node,ops?){
    var textSearch = nodeTextSearch();
    var setVal = typeof replaceValue === "string" ?document.createTextNode(replaceValue) : replaceValue;
    var isGlobal = typeof searchValue === "object" ? searchValue.global : false;
    if(!isGlobal){
        moveInEveryNode(elem,actual =>{textSearch.add(actual)});
        var result = textSearch.location(searchValue);
        if(result){
            clearAndSet(result,setVal);
        }
    }else{
        var regex =<RegExp>searchValue;
        var actualPosition = 0;
        var allNodes:Node[] = [];
        moveInEveryNode(elem,actual =>{allNodes.push(actual)});
        while(actualPosition <= allNodes.length){
            const nodeFromThisPos = allNodes[actualPosition];
            var info = textSearch.location(regex);
            if(!info){
                if(!nodeFromThisPos){
                    break;
                }
                actualPosition++;
                textSearch.add(nodeFromThisPos);
            }else{
                //keeps adding nodes to make sure the regex is found completely
                if(info.end.node === allNodes[actualPosition - 1] && nodeFromThisPos){
                    actualPosition ++;
                    textSearch.add(nodeFromThisPos);
                }else{
                    var retNodes = clearAndSet(info,setVal.cloneNode(true));
                    textSearch = nodeTextSearch();
                    allNodes.splice(actualPosition - 1,0,...retNodes);
                    allNodes =allNodes.filter(val =>val.isConnected);
                    var backPos = (info.start.node != info.end.node ? 2 : 0) + info.elems.length
                    actualPosition+= 1 - backPos;
                }
            }

        }
    }
    function clearAndSet(info:locationResults,insert:Node){
        if(info.start.node === info.end.node){
            return opSameStartAndEnd();
        }else{
            return rebuildStartAndEndNodes();
        }
        function opSameStartAndEnd(){
            const node = info.start.node;
            const TOT_LENGTH = node.textContent.length;
            if(info.start.localPos === 0 && info.end.localPos === TOT_LENGTH){
                replaceBefore(node);
                removeNode(node);
                return [insert];
            }else{
                return rebuildStartAndEndNodes();
            }
        }
        function rebuildStartAndEndNodes():Node[]{
            var nodeBefore =splitBefore(info.start.node,info.start.localPos);
            var nextNode =splitAfter(info.end.node,info.end.localPos);
            if(nodeBefore){
                info.start.node.parentElement.insertBefore(nodeBefore,info.start.node);
            }
            info.end.node.parentElement.insertBefore(nextNode,info.end.node);
            replaceBefore(nextNode);
            if(info.start.node != info.end.node){
                removeNode(info.end.node);
            };
            for(const rmNode of info.elems){
                removeNode(rmNode);
            }
            removeNode(info.start.node);
            var ret = [];
            if(nodeBefore){
                ret.push(nodeBefore);
            }
            ret.push(insert);
            if(nextNode.textContent != ""){
                ret.push(nextNode);
            }else{
                removeNode(nextNode);
            }
            return ret;
        }
        function splitAfter(node:Node,endLocalPositionReplace:number){
            if(endLocalPositionReplace === 0){
                return node.cloneNode();
            }else{
                var putInNewNode = node.textContent.substring(endLocalPositionReplace);
                return document.createTextNode(putInNewNode);
            }
        }
        function splitBefore(node:Node,startLocalPositionReplace:number){
            if(startLocalPositionReplace === 0){
                return null;
            };
            var text = node.textContent;
            return document.createTextNode(text.substring(0,startLocalPositionReplace));
        }
        function replaceBefore(node:Node){
            node.parentElement.insertBefore(insert,node);
        }
        function removeNode(node:Node){
            node.parentElement.removeChild(node);
        };
    }
}
/**
 * System used to get the nodes with the passed text
 */
function nodeTextSearch(){
    var nodes:Node[] = [];
    var nodeEnd:number[] = [];
    var fullText = "";
    var totalLength = 0;
    return {
        /**
         * Add elements to by searched
         */
        add(node:Node){
            totalLength += node.textContent.length;
            nodes.push(node);
            nodeEnd.push(totalLength);
            fullText+=node.textContent;
        },
        /**search for text and return the position */
        search(searchFor:string | RegExp){
            return fullText.search(searchFor);
        },
        /**
         * Get detailed info from the search
         */
        location(searchFor:string | RegExp):locationResults | null{
            var startPos =typeof searchFor == "string"? fullText.indexOf(searchFor) : fullText.search(searchFor);
            if(startPos === -1)
                return null;
            var lengthMatchedText = typeof searchFor === "string" ? searchFor.length : fullText.match(searchFor)[0].length;
            var start:NodePosition = position(startPos);
            var end:NodePosition = position(startPos+ lengthMatchedText);
            runPosition(start,compareMode(">"));
            runPosition(end,compareMode(">="));//fix getting last position
            var sendElems:Node[] = [];
            for(var index = start.index + 1; index <= end.index -1;index++){
                sendElems.push(nodes[index]);
            }
            return {
                start,
                end,
                elems: sendElems
            }
            function position(starting:number):{node:Node,localPos:number,startIn:number,index:number}{
                return {
                    node:null,
                    localPos:0,
                    startIn:starting,
                    index:-1
                }
            }
            function runPosition(pos:{node:Node,localPos:number,startIn:number,index:number},evaluator:(a:number,b:number)=>boolean){
                for(var cont = 0; nodeEnd.length > cont;cont++){
                    const actualLength = nodeEnd[cont];
                    if(evaluator(actualLength,pos.startIn)){
                        pos.index = cont;
                        pos.node = nodes[cont];
                        const lastValue = cont != 0 ? nodeEnd[cont-1] : 0;
                        const length = actualLength - lastValue;
                        pos.localPos =length - (actualLength - pos.startIn);
                        break;
                    }
                }
            }
            function compareMode(mode = ">"){
                if(mode == ">"){
                    return (a,b)=>{
                        return a > b;
                    }
                };
                if(mode == ">="){
                    return (a,b)=>{
                        return a >=b;
                    }
                }
            }
        }
    }
}
/**
 * Set the cursor location in actual element
 */
function setSelection(child:Node,loc:number){
    var range = document.createRange()
    var sel = window.getSelection()
    range.setStart(child, loc);
    range.collapse(true)
    sel.removeAllRanges();
    sel.addRange(range);
}
export {
    getCaretPosition,
    getEndChild,
    getStartChild,
    replace,
    splitElem,
    getDataFromPosition,
    moveInEveryNode,
    setCaretToEnd,
    getLocalPath,
    setCaret,
    buildElemPath,
    getLocalPosition,
    nodeTextSearch
}