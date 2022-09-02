const {Page} =require("puppeteer");
const {existsSync} = require("fs");
const {join,sep} = require("path");

var actualDir = __dirname.split(sep);
actualDir.pop();

class htmlTester{
    awaitAfterResult =0;
    awaitTestStart = 0;
    #filePath;
    #scripts = [];
    #dataFolder = "data";
    /**
     * @param filename html filename with expected directory in test/data
     */
    constructor(filename,dir=""){
        this.actualDir = actualDir;
        if(dir){
            this.#dataFolder = join("data",dir);
        }
        var filePath = join(...actualDir,"test",this.#dataFolder,filename);
        if(!existsSync(filePath))
            throw "HTML File Not Exist in path: "+filePath;
        this.#filePath = filePath;
    };
    injectScriptFile(filename){
        var scriptPath = join(...actualDir,"test",this.#dataFolder,"scripts",filename);
        if(!existsSync(scriptPath))
            throw "Script Not Exist in path: "+scriptPath;
        this.#scripts.push({url:scriptPath});
    };
    injectScript(script){
        this.#scripts.push({content:script});
    }
    /**
     * 
     * @param {Page} page 
     * @returns {Promise<string>}
     */
    async getResult(page){
        return new Promise((resolve,reject) =>{
            page.on("error"),(e)=>{
                throw e;
            }
            page.on("console",(e)=>{
                if(e.type() === "error"){
                    reject( "Test Execution Failed, Error In File, returned error: "+e.text() + "\n" + e.stackTrace());
                };
                if(e.type() === "debug"){
                    var text = e.text();
                    if(text.startsWith("$END$")){
                        resolve(text.replace("$END$",""))
                    }
                }
            })
            page.goto(this.#filePath,{waitUntil:"networkidle2"}).then(async ()=>{
                for(const script of this.#scripts){
                    await page.addScriptTag(script);
                }
                setTimeout(()=>{
                    reject("TIMEOUT ERROR");
                },10000);
            })
        })
    }
}
module.exports = htmlTester;