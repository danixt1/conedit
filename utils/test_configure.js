var browserGetter = require("./browser");
var browser = null;
var MakeTest = require("./MakeTest");
const path = require("path");
/**@type {import("puppeteer").Page} */
var page;
const pageDir =function(){
    var basicDir = __dirname.split(path.sep);
    basicDir.pop();
    return path.join(...basicDir,"test","src","index.html");
}();

module.exports = {
    start,
    async getContext(filename,script){
        await page.reload({waitUntil:"networkidle2"});
        await page.addScriptTag({content:script});
        class ContextTest extends MakeTest{
            constructor(id,testName){
                super(id,page);
            }
        }
        return ContextTest
    },
    async end(){
        if(browserGetter.browser){
            await browserGetter.browser.close();
            browser = null;
        }
    }
}
async function start(headless = false){
    if(browser)
        return;
    browser = await browserGetter(headless);
    var pages = await browser.pages();
    for(const actual of pages){
        if(actual.url() === "about:blank"){
            page = actual;
            await page.goto(pageDir);
        }
    }
    if(!page){
        page = await browser.newPage();
        await page.goto(pageDir);
    }
}