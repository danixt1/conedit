var htmlTester = require("./htmlTester");
const assert = require("assert");
async function openPage(browser,file,scripts,defaultScript){
    var testPage = new htmlTester(file,"elemFuncs");
    var page = await newPage(browser);
    testPage.injectScript(defaultScript);
    if(Array.isArray(scripts)){
        scripts.forEach(script =>{
            testPage.injectScriptFile(script);
        });
    }else{
        testPage.injectScriptFile(scripts);
    }
    var response = await testPage.getResult(page);
    if((await browser.pages()).length === 1){
        await page.goto("about:blank");
    }else
        await page.close();
    return response
}
/**
 * @returns {puppeter.Page}
 */
async function newPage(browser){
    var pages = await browser.pages();
    for(const page of pages){
        if(page.url() === "about:blank"){
            return page;
        }
    };
    return await browser.newPage();
}
function itTrue(browser,htmlFile,jsTest,defaultScript){
    return async function(){
        var response = await openPage(browser,htmlFile,jsTest,defaultScript);
        assert.ok(response === "true");
    }
}
module.exports = function(){
    var browser,defaultScript;
    var obj = {
        async openPage(file,scripts){
            return await openPage(browser,file,scripts,defaultScript)
        },
        async newPage(){
            return await newPage(browser);
        },
        itTrue(htmlFile,jsTest){
            return ()=> itTrue(browser,htmlFile,jsTest,defaultScript)();
        },
        setBrowser(Browser){
            browser = Browser;
        },
        setDefaultScript(script){
            defaultScript = script;
        },
        set(browser,script){
            obj.setBrowser(browser);
            obj.setDefaultScript(script);
        }
    }
    return obj
}