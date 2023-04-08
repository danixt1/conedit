import {getCaretPosition,setCaret,getStartChild,getEndChild,nodeTextSearch,replace,moveInEveryNode} from "/lib/elemFuncs.js";
import {getRelativeErrorLocation} from "../report.js";
const MAIN_CONTENT_ID = "content";
var assert = chai.assert;
var $cont = $("#"+MAIN_CONTENT_ID);
describe("[Internal]elemFuncs.js",()=>{
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
    it("setCaret()",async ()=>{
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
            message = "The actual refered node, not is the expected node.\n from "+getRelativeErrorLocation();
        }else{
            if(!POSITION_IS_VALID){
                message = "The position from the cursor is incorrect.\n from "+getRelativeErrorLocation();
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
    });
    //Text descriptions:
    //NODES:[resultIn,tot] the amount of elements the text has been separated.
    //  resultIn: the quanty of nodes with result
    //  tot: the total of nodes in the test.
    //SEARCH: The Type of search realized to get the value.
    //PUT: the type to replace the matched value(s).
    describe("nodeTextSearch()",function(){
        //nodeTextSearch is to localize string in multiple nodes, is a option to add in internal part of replace()

        function nodeTextSearchFactory(textSearch = nodeTextSearch()){
            var nodes =[];
            return{
                addNodes(...names){
                    for(var name of names){
                        const BAR_POS = name.indexOf("/");
                        var childPos =0;
                        if(BAR_POS > -1){
                            childPos = Number.parseInt(name.substring(BAR_POS+1));
                            name = name.substring(0,BAR_POS);
                        };
                        const elem = document.getElementById(name);
                        if(!elem){
                            throw "Elem with id "+name+" not exist";
                        }
                        const node = elem.childNodes[childPos];
                        if(!node){
                            throw "Elem with id "+name+ " not have child "+childPos;
                        };
                        nodes.push(node);
                        textSearch.add(node);
                    }
                },
                nodes
            }
        }
        function genSpanToStrings(...parts){
            var ids = [];
            var final = "";
            var originalText = "";
            for(const part of parts){
                ids.push('part'+ids.length);
                final+=`<span id=${ids[ids.length-1]}>${part}</span>`;
                originalText+=part;
            };
            return {htmlText:final,text:originalText,ids};
        }
        it("NODES:[2,3] SEARCH:string",async ()=>{
            const ELEMS_TO_SEARCH = 'not the node <span id="node0">starting here <span id="node1">ending here</span></span>';
            const SEARCH_TEXT = "starting here ending here";
            $cont.html(ELEMS_TO_SEARCH);
            var textSearch = nodeTextSearch();
            const {addNodes:nodesWithText,nodes} = nodeTextSearchFactory(textSearch);

            nodesWithText("content","node0","node1");
            var obj = textSearch.location(SEARCH_TEXT);
            var result = {
                start:obj.start.node == nodes[1],
                end:obj.end.node == nodes[2]
            }
            assert.strictEqual(JSON.stringify(result),JSON.stringify({
                start:true,
                end:true
            }));
        })
        it("NODES:[2,3] SEARCH:string DESC:get the start and the end in the middle of node",async ()=>{
            const PART0 = "fiRst ";
            const PART1 = "eNd";
            const ELEMS_TO_SEARCH = `${PART0}<b id="node1">${PART1}</b>`;
            const SEARCH_TEXT = "Rst eN";
            $cont.html(ELEMS_TO_SEARCH);

            var textSearch = nodeTextSearch();
            const {addNodes:nodesWithText} = nodeTextSearchFactory(textSearch);
            nodesWithText(MAIN_CONTENT_ID,"node1");
            var loc = textSearch.location(SEARCH_TEXT);
            var result = {
                index_start:loc.start.localPos,
                index_end:loc.end.localPos
            };

            const startSub = result.index_start;
            const endSub = result.index_end + PART0.length;
            assert.equal(SEARCH_TEXT, (PART0 + PART1).substring(startSub,endSub));
        });
        it("NODES:[2,4] SEARCH:regexp(nonGlobal)",function (){
            //In this test the nodeTextSearch need to encounter the 2 span valids to REGEX_INPUT
            var pre = ["512 12","GET_THIS"];
            const PRE_LENGTH = pre.reduce((p,c)=>p.length+c.length);
            const{htmlText:HTML_STRING,text:ORIGINAL_TEXT,ids }= genSpanToStrings(...pre,"_PART"," 241");
            const REGEX_INPUT = /([A-Z]+_*)+/;
            if("512 12 GET_THIS_PART 241".match(REGEX_INPUT)?.[0] !== "GET_THIS_PART"){
                this.test.title = "[INTERNAL FAILURE] " +this.test.title;
                throw new Error("invalid regex in test");
            }
            const EXPECTED = ORIGINAL_TEXT.match(REGEX_INPUT)[0];
            $cont.html(HTML_STRING);
            var textSearch = nodeTextSearch();
            const {addNodes} = nodeTextSearchFactory(textSearch);
            addNodes(...ids);
            var pos =textSearch.location(REGEX_INPUT);
            var result = {
                index_start:pos.start.localPos,
                index_end:pos.end.localPos
            }
            var textResult = ORIGINAL_TEXT.substring(pre[0].length + result.index_start,PRE_LENGTH + result.index_end);
            assert.strictEqual(textResult,EXPECTED,"expected:"+EXPECTED + "\n but returned:"+textResult);
        });
    });
    describe("replace()",function(){
        it("NODES:[1,1] SEARCH:string PUT:string",async ()=>{
            const TEXT_TO_CHANGE = "simple text";
            const CHANGE_TO = "other text";
            $cont.html(TEXT_TO_CHANGE);
            replace(document.getElementById("content"),TEXT_TO_CHANGE,CHANGE_TO);
            var value =  document.getElementById("content").innerHTML;
            assert.equal(value,CHANGE_TO,`Expected text is ${CHANGE_TO} but returned ${value}`);
        });
        it("NODES:[1,1] SEARCH:Regexp(nonGlobal) PUT:string",async ()=>{
            const TEXT_TO_CHANGE = "simple text";
            const MATCH_REGEX = /text/;
            const CHANGE_TO = "string";

            const EXPECTED = TEXT_TO_CHANGE.replace(MATCH_REGEX,CHANGE_TO);

            $cont.html(TEXT_TO_CHANGE);

            replace(document.getElementById("content"),new RegExp(MATCH_REGEX),CHANGE_TO);
            var value = document.getElementById("content").innerHTML;
            assert.equal(value,EXPECTED);
        });
        it("NODES:[2,3] SEARCH:string PUT:string",async ()=>{
            const TEXT_TO_CHANGE = "start <b>end here <b> and continue";
            const MATCH_TEXT = "start end";
            const CHANGE_TO = "test";
            const EXPECTED = "test here and continue";

            $cont.html(TEXT_TO_CHANGE);
            replace(document.getElementById("content"),MATCH_TEXT,CHANGE_TO);
            var result =  document.getElementById("content").innerText;
            assert.equal(result,EXPECTED);
        });
    })
    describe("moveInEveryNode()",function(){
        var textArr = ["Test if"," the order"," moved is valid ","to text"];
        const ELEMS_TO_SEARCH = `${textArr[0]}<span>${textArr[1]}</span><br>${textArr[2]}<b>${textArr[3]}</b>`;
        it("Move in sequence (left to right)",async ()=>{
            const EXPECTED = textArr.join("");

            $cont.html(ELEMS_TO_SEARCH);
            var actualText = "";
            moveInEveryNode(document.getElementById("content"),(node)=>{
                actualText+=node.textContent;
            },"start");
            var result = actualText
            assert.strictEqual(result,EXPECTED);
        });
        it("Move in sequence (right ro left)",async ()=>{
            const EXPECTED = textArr.reverse().join("");

            $cont.html(ELEMS_TO_SEARCH);
            var actualText = "";
            moveInEveryNode(document.getElementById("content"),(node)=>{
                actualText+=node.textContent;
            },"end");
            var result = actualText;

            assert.strictEqual(result,EXPECTED);
        });
    });
})