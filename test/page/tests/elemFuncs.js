import {getCaretPosition,setCaret,getStartChild,getEndChild} from "/lib/elemFuncs.js";
var assert = chai.assert;
var $cont = $("#content");
const ID_FILE = "test/page/tests/elemFuncs.js"
// var describe = Mocha.describe;
// var afterEach = Mocha.afterEach;
// var it = Mocha.it;
describe("elemFuncs",()=>{
    afterEach(()=>{
        $cont.html("");
    })
    it("getCaretPosition()",async ()=>{
        $cont.html("lorem <b>it dor<b> as <i>fasge</i> <span>fa <b id=\"elemMark\">TESTE</b> Lorem</span>");
        var range = document.createRange()
        var sel = window.getSelection()
        range.setStart($("#elemMark").get(0).childNodes[0], 2);
        range.collapse(true)
        sel.removeAllRanges();
        sel.addRange(range);
    
        var val = getCaretPosition($cont.get(0));
        assert.equal(val,27);
    });
    it("setCaretPosition()",async ()=>{
        $cont.html("it the <b>text <i id=\"mark\">to</i> set</b> the position");
        setCaret($cont.get(0),13);
        var mark = $("#mark").get(0);
        var message = "";
        //Get the local position from caret, is expected position 1 of elem id="mark", position equals 1
        var range = document.createRange()
        var sel = window.getSelection()
        var caretPos = null;
        if (sel.rangeCount) {
            range = sel.getRangeAt(0);
            caretPos = range.endOffset;
        }
        //Compare if The position of caret is in expected node(elem#mark.child(0)) and local position(1)
        const NODE_IS_VALID = sel.focusNode === mark.childNodes[0];
        const POSITION_IS_VALID = caretPos === 1;//The refered position is from the node inside the elem#mark
        var result = NODE_IS_VALID && POSITION_IS_VALID;
        if(!NODE_IS_VALID){
            message = "The actual refered node, not is the expected node.\n from "+ID_FILE+":42:11";
        }else{
            if(!POSITION_IS_VALID){
                message = "The position from the cursor is incorrect.\n from "+ID_FILE+":45:11";
            }
        }
        assert.ok(result,message);
    });
    const HTML_START_END_CHILD = '<span id="first">first node</span> <b>seconde node</b> <i id="end">final Node</i>';
    it("getStartChild()",async ()=>{
        $cont.html(HTML_START_END_CHILD);
        var firstChild = getStartChild($cont.get(0));
        assert.ok(firstChild === document.getElementById("first").childNodes[0])
    });
    it("getEndChild()",async ()=>{
        $cont.html(HTML_START_END_CHILD);
        var endChild =getEndChild($cont.get(0));
        assert.ok(endChild === document.getElementById("end").childNodes[0])
    })
})