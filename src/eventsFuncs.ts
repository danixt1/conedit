import {getLocalPath,buildElemPath,getDataFromPosition} from "./elemFuncs"
import {contentTag,markFormat} from "./tags"
function pathChangerEvent():eventObject{
    var mappedPath:Element[];
    return {
        listener,
        set path(setThis:Element[]){
            mappedPath = setThis;
        }
    }
    function listener(content:ContentEditable,event:KeyboardEvent){
        var actualCaretPos = content.caretPosition;
        var startIn = null;
        var compareTo = getLocalPath(content[contentTag],actualCaretPos);
        for(const key in mappedPath){
            var path1 = mappedPath[key];
            var path2 = compareTo[key];
            var isDifferent = path1[markFormat] && path2[markFormat] ? path1[markFormat] != path2[markFormat] : path1 != path2
            if(isDifferent){
                startIn = key;
                break;
            };
        };
        if(!startIn){
            return;
        };
        var dataInfo = getDataFromPosition(content[contentTag],actualCaretPos);
        var lastElem:Node | Element = dataInfo.node;
        var text = lastElem.textContent;
        var textPart1 = text.substring(0,dataInfo.localPosition -1);
        var textPart2 = text.substring(dataInfo.localPosition);
        lastElem.textContent = textPart1 + textPart2;
        var insert = buildElemPath(mappedPath,document.createTextNode(event.key));
        content.insertInPosition(insert,actualCaretPos -1);
        content.caretPosition = actualCaretPos;
    }
}
export {
    pathChangerEvent
}