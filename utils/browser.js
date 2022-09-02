var puppeter = require("puppeteer");
/**@type {puppeter.Browser} */
var browser;
async function startBrowser(headless = false){
    var config = {
        headless:false,
        slowMo: 500,
        devtools:true
    }
    if(headless)
        config = {};
    if(!browser){
        browser = await puppeter.launch(config)
        startBrowser.browser = browser;
    }
    return browser;
}
module.exports = startBrowser