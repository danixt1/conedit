const assert = require("assert");
var path =require("path");
var {openPage,set:toolsCofig,itTrue} = require("../utils/test_tools")();
var injectCode = null;
/**@type {puppeter.Browser} */
var browser;
before(async function(){
    var iife = require("../utils/getCodeIIFE");
    var absPath = __dirname.split(path.sep);
    absPath.pop();
    var dir = path.join(...absPath,"lib","elemFuncs.js");
    injectCode = await iife(dir,"test");
    browser = await require("../utils/browser")(true);
    toolsCofig(browser,injectCode);
});
var tests = {
    getCaretPosition(){
        it("get correct position from cursor",async ()=>{
            var response = await openPage("getCaretPosition.html","getCaret.js");
            assert.equal(response,27);
        })
    },
    setCaret(){
        it("set in absolute position from element",itTrue("setCaret.html","setCaret.js"))
    },
    getStartChild(){
        it("Get First Node Text",itTrue("startEndChild.html","getStartChild.js"))
    },
    getEndChild(){
        it("get Last Node Text",itTrue("startEndChild.html","getEndChild.js"));
    }
}

describe("elemFuncs",exec);

after(async ()=>{
    await browser.close();
})
function exec(){
    createTest(tests.getCaretPosition);
    createTest(tests.setCaret);
    return
    for(const [testName,test] of Object.entries(tests)){
        createTest(test);
    }
}
function createTest(func){
    describe(func.name+"()",func);
}