var browserGetter = require("./browser");
/**@type {import("puppeteer").Browser} */
var browser = browserGetter.browser;
/**@type {import("puppeteer").Page} */
var testPage = null;
var pageDir = "../test/src/index.html";

class makeTest{
    #contentId;
    constructor(title,contentId = "elem"){
        if(!browser){
            browser = browserGetter.browser;
            if(!browser)
                throw "Browser not started, please start the browser first"
        };
        this.#contentId = contentId;
    }
    async append(text){
        var page =await getPage();
        await page.waitForSelector("#"+this.#contentId);
        await page.evaluate((innerHtml,id)=>{
            var elem = document.getElementById(id);
            elem.innerHTML = innerHtml;
            return true;
        },text,this.#contentId)
    }
    async appendInBody(text){
        
    }
    async testFunc(func,...args){

    }
}
async function getPage(){
    if(testPage)
        return testPage;
    testPage = await browser.newPage();
    await testPage.goto(pageDir);
    return testPage;
}