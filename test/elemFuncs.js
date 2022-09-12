const HEADLESS = true;
const HTML_START_END_CHILD = '<span id="first">first node</span> <b>seconde node</b> <i id="end">final Node</i>'

const assert = require("assert");
var testConfig = require("../utils/test_configure");
var {createStringFunc} = require("conedit/utils/test_tools");

/**@type {typeof import("../utils/MakeTest")} */
var testObj;


before(async function(){
    const path =require("path");
    const iife = require("../utils/getCodeIIFE");
    var injectCode = null;

    //Get the absolute dir
    var absPath = __dirname.split(path.sep);
    absPath.pop();
    var dir = path.join(...absPath,"lib","elemFuncs.js");

    //Make a web version from the actual code tested code, to call the propertys in web context call the "test" object
    injectCode = await iife(dir,"test");

    //Start the browser and go to the test page
    await testConfig.start(HEADLESS);

    //Get Test Object, Allow to send one time the original file
    testObj =await testConfig.getContext("elemFuncs.js",injectCode)
});
var tests = {
    getCaretPosition(){
        it("get correct position from cursor",async ()=>{
            var page = new testObj("elem");
            page.append("lorem <b>it dor<b> as <i>fasge</i> <span>fa <b id=\"elemMark\">TESTE</b> Lorem</span>");
            page.testFunc(()=>{
                var range = document.createRange()
                var sel = window.getSelection()
                range.setStart(document.getElementById("elemMark").childNodes[0], 2);
                range.collapse(true)
                sel.removeAllRanges();
                sel.addRange(range);

                return test.getCaretPosition(document.getElementById("elem"))
            });
            var val =await page.start();
            assert.equal(val,27);
        })
    },
    setCaretPosition(){
        it("set cursor in position",async ()=>{
            var page = new testObj("elem");
            page.append("it the <b>text <i id=\"mark\">to</i> set</b> the position");
            page.testFunc(()=>{
                test.setCaret(document.getElementById("elem"),13);

                //Get the local position from caret, is expected position 1 of elem id="mark", position equals 1
                var range = document.createRange()
                var sel = window.getSelection()
                var caretPos = null;
                if (sel.rangeCount) {
                    range = sel.getRangeAt(0);
                    caretPos = range.endOffset;
                }
                //Compare if The position of caret is in expected node(elem#mark.child(0)) and local position(1)
                var result = sel.focusNode === document.getElementById("mark").childNodes[0] && caretPos === 1;
                return result
            });
            assert.ok(page.start());
        })
    },
    getStartChild(){
        it("get the first node in text",async ()=>{
            var page = new testObj("elem");
            page.append(HTML_START_END_CHILD);
            page.testFunc(()=>{
                var firstChild = test.getStartChild(document.getElementById("elem"));
                return firstChild === document.getElementById("first").childNodes[0]
            })
            assert.ok(await page.start())
        })
    },
    getEndChild(){
        it("get the last node in texts",async ()=>{
            var page = new testObj("elem");
            page.append(HTML_START_END_CHILD);
            page.testFunc(()=>{
                var endChild = test.getEndChild(document.getElementById("elem"));
                return endChild === document.getElementById("end").childNodes[0]
            })
            assert.ok(await page.start())
        })
    },
    nodeTextSearch(){
        //nodeTextSearch is used by replace function to complex search and replacement
        
        function addNodesFactory(nodes,textSearch){
            return function addNodes(...names){
                for(var name of names){
                    const BAR_POS = name.indexOf("/");
                    var childPos =0;
                    if(BAR_POS > -1){
                        childPos = Number.parseInt(name.substring(BAR_POS+1));
                        name = name.substring(0,BAR_POS);
                    };
                    const elem = document.getElementById(name);
                    if(!elem){
                        throw "CONTEXT BROWSER TEXT FAILED: Elem with id "+name+ " not exist";
                    }
                    const node = elem.childNodes[childPos];
                    if(!node){
                        throw "CONTEXT BROWSER TEXT FAILED: Elem with id "+name+ " not have child "+childPos;
                    };
                    nodes.push(node);
                    textSearch.add(node);
                }
            }
        }
        const FUNC_ARRAY_ADD_NODES = createStringFunc(addNodesFactory,"nodes","textSearch");
        it("get initial node and final node from text",async ()=>{
            const ELEMS_TO_SEARCH = 'not the node <span id="node0">starting here <span id="node1">ending here</span></span>';
            const SEARCH_TEXT = "starting here ending here";
            var page = new testObj("elem");
            page.append(ELEMS_TO_SEARCH);
            page.testFunc((SEARCH_TEXT,addNodes)=>{
                var textSearch = test.nodeTextSearch();
                var nodes = [];
                var addNodes = new Function(...addNodes)(nodes,textSearch);
                addNodes("elem","node0","node1");
                var obj = textSearch.location(SEARCH_TEXT);
                return {
                    start:obj.start.node == nodes[1],
                    end:obj.end.node == nodes[2]
                }
            },SEARCH_TEXT,FUNC_ARRAY_ADD_NODES);
            var result = await page.start();

            assert.strictEqual(JSON.stringify(result),JSON.stringify({
                start:true,
                end:true
            }));
        });
        it("check if localPostion from start and end is valid to substring",async ()=>{
            const PART0 = "fiRst ";
            const PART1 = "eNd";
            const ELEMS_TO_SEARCH = `${PART0}<b id="node1">${PART1}</b>`;
            const SEARCH_TEXT = "Rst eN";
            var page = new testObj("elem");
            page.append(ELEMS_TO_SEARCH);
            page.testFunc((SEARCH_TEXT,addNodes)=>{
                var nodes = [];
                var textSearch = test.nodeTextSearch();
                var addNodes = new Function(...addNodes)(nodes,textSearch);
                addNodes("elem","node1");
                var loc = textSearch.location(SEARCH_TEXT);
                return {
                    index_start:loc.start.localPos,
                    index_end:loc.end.localPos
                };
            },SEARCH_TEXT,FUNC_ARRAY_ADD_NODES);
            var result = await page.start();
            const startSub = result.index_start;
            const endSub = result.index_end + PART0.length;
            assert.equal(SEARCH_TEXT, (PART0 + PART1).substring(startSub,endSub));
        });
        it("check if initial node and final node from regex",async ()=>{
            var page = new testObj("elem");
            var ids = [];
            var pre = ["512 12","GET_THIS"];
            const PRE_LENGTH = pre.reduce((p,c)=>p.length+c.length);
            const{elem:ELEMS_TO_SEARCH,text:ORIGINAL_TEXT }= gen(...pre,"_PART"," 241");
            const REGEX_INPUT = /([A-Z]+_*)+/;
            const EXPECTED = ORIGINAL_TEXT.match(REGEX_INPUT)[0];
            page.append(ELEMS_TO_SEARCH);
            page.testFunc((REGEX_INPUT,addNodes,ids)=>{
                var nodes = [];
                var textSearch = test.nodeTextSearch();
                REGEX_INPUT =new RegExp(REGEX_INPUT.replace(/\//g,""));
                addNodes = new Function(...addNodes)(nodes,textSearch);
                addNodes(...ids);
                var pos =textSearch.location(REGEX_INPUT);
                return {
                    index_start:pos.start.localPos,
                    index_end:pos.end.localPos
                }
            },REGEX_INPUT.toString(),FUNC_ARRAY_ADD_NODES,ids);
            var result =await page.start();
            assert.strictEqual(ORIGINAL_TEXT.substring(pre[0].length + result.index_start,PRE_LENGTH + result.index_end),EXPECTED);
            function gen(...parts){
                var final = "";
                var originalText = "";
                for(const part of parts){
                    ids.push('part'+ids.length);
                    final+=`<span id=${ids[ids.length-1]}>${part}</span>`;
                    originalText+=part;
                };
                return {elem:final,text:originalText};
            }
        });
    },
    replace(){
        it("Replace simple text using string replacing to string",async ()=>{
            const TEXT_TO_CHANGE = "simple text";
            const CHANGE_TO = "other text";
            var page = new testObj("elem");
            page.append(TEXT_TO_CHANGE);
            page.testFunc((TEXT_TO_CHANGE,CHANGE_TO)=>{
                test.replace(document.getElementById("elem"),TEXT_TO_CHANGE,CHANGE_TO);
                return document.getElementById("elem").innerHTML;
            },TEXT_TO_CHANGE,CHANGE_TO);
            assert.equal(await page.start(),CHANGE_TO);
        });
        it("Replace simple text using Regexp(no global) replacing to string",async ()=>{
            const TEXT_TO_CHANGE = "simple text";
            const MATCH_REGEX = /text/;
            const CHANGE_TO = "string"
            const EXPECTED = TEXT_TO_CHANGE.replace(MATCH_REGEX,CHANGE_TO);
            var page = new testObj("elem");
            page.append(TEXT_TO_CHANGE);
            page.testFunc((MATCH_REGEX,CHANGE_TO)=>{
                MATCH_REGEX = MATCH_REGEX.replace(/\//g,"");

                test.replace(document.getElementById("elem"),new RegExp(MATCH_REGEX),CHANGE_TO);
                return document.getElementById("elem").innerHTML;
            },MATCH_REGEX.toString(),CHANGE_TO);
            assert.equal(await page.start(),EXPECTED);
        });
        it("Replace text in various nodes using string replacing to string",async ()=>{
            const TEXT_TO_CHANGE = "start <b>end here <b> and continue";
            const MATCH_TEXT = "start end";
            const CHANGE_TO = "test";
            const EXPECTED = "test here and continue";
            var page = new testObj("elem");
            page.append(TEXT_TO_CHANGE);
            page.testFunc((MATCH_TEXT,CHANGE_TO)=>{
                test.replace(document.getElementById("elem"),MATCH_TEXT,CHANGE_TO);
                return document.getElementById("elem").innerText;
            },MATCH_TEXT,CHANGE_TO);
            var result = await page.start();
            assert.equal(result,EXPECTED);
        })
    },
    //TODO
    moveInEveryNode(){

    }
}

describe("elemFuncs",exec);

after(async ()=>{
    await testConfig.end();
})
function exec(){
    createTest(tests.replace);
    for(const [testName,test] of Object.entries(tests)){
        //createTest(test);
    }
}
function createTest(func){
    describe(func.name+"()",func);
}