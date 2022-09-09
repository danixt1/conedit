const HEADLESS = true;
const HTML_START_END_CHILD = '<span id="first">first node</span> <b>seconde node</b> <i id="end">final Node</i>'

const assert = require("assert");
var testConfig = require("../utils/test_configure");
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
        it("get initial node and final node from matched text",async ()=>{
            const ELEMS_TO_SEARCH = 'not the node <span id="node0">starting here <span id="node1">ending here</span></span>';
            const SEARCH_TEXT = "starting here ending here";
            var page = new testObj("elem");
            page.append(ELEMS_TO_SEARCH);
            page.testFunc((SEARCH_TEXT)=>{
                //Get Nodes to put in test
                const firstNode = document.getElementById("elem").childNodes[0];
                const startNode = document.getElementById("node0").childNodes[0];
                const endNode = document.getElementById("node1").childNodes[0];

                //add nodes to textSearch
                var textSearch = test.nodeTextSearch();
                textSearch.add(firstNode);
                textSearch.add(startNode);
                textSearch.add(endNode);

                var obj = textSearch.location(SEARCH_TEXT);

                //Check if propertys is equal to expected
                const CHECK_START = obj.start.node == startNode;
                const CHECK_END = obj.end.node == endNode;
                const CHECK_ELEMS = obj.elems.length ==0;//elems property don't include start and end elem just the middle elems
                const CHECK_TEXT_EXIST = textSearch.search(SEARCH_TEXT) == 13;
                return {
                    start:CHECK_START,
                    end:CHECK_END,
                    elems:CHECK_ELEMS,
                    exist:CHECK_TEXT_EXIST
                }
            },SEARCH_TEXT);
            var result = await page.start();
            assert.equal(result,{
                start:true,
                end:true,
                elems:true,
                exist:true
            });
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
    }
}

describe("elemFuncs",exec);

after(async ()=>{
    await testConfig.end();
})
function exec(){
    for(const [testName,test] of Object.entries(tests)){
        createTest(test);
    }
}
function createTest(func){
    describe(func.name+"()",func);
}