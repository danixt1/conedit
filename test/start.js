
import express from "express";

import puppeteer  from "puppeteer";
import {join} from "path";
import assert from "assert";
import * as chai from "chai";
import { exec } from "child_process";
const MATCH_SPACES_IN_NOT_QUOTATIONS = /((?<='[^']+'|"[^"]+")|(?<!".+|'.+))\s/;
const TEXT_IN_QUOTATION_MARKS = /"(-{1,2}\w+=(?:\\"|[^"])+)"|'(-{1,2}\w+=(?:[^']|\\')+)'|(-{1,2}\w+=)"((?:\\"|[^"])+)"|(-{1,2}\w+=)'((?:\\'|[^'])+)'/;
var app = express();
/**@type {"default"|"waitSucess"|"waitFinish"} */
var mode = "default";
var headless = true;
var returnTestResult = true;
var port = 7000;
var runWebDriver = true;
var execCmd = null;//execute command after server is started

var server,browser;

app.use(express.json());
app.use(express.static(join("test","page")));
app.use("/lib",express.static(join("lib")));
app.use("/mocha",express.static(join("node_modules","mocha")));
app.use("/chai",express.static(join("node_modules","chai")));

start();

async function start(){
    var finish = false;
    var args;
    process.argv.find((val)=>{
        if(val.startsWith("--args=")){
            args =  val.substring(7);
            return true;
        }
    });
    if(args){
        var argList = args.split(MATCH_SPACES_IN_NOT_QUOTATIONS).map(val =>{
            var regVal;
            var value = val.match(TEXT_IN_QUOTATION_MARKS);
            if(value){
                regVal = value[1] || value[2] || value[3]+value[4] || value[5]+value[6]
            }
            return regVal || val
        });
        argList.forEach(e =>{
            var [type,value] = e.split("=");
            var descs = [];
            if(opt('port','p','Define the port to open the test server(default:7000)')){
                port = Number(value) || port;
            }
            if(opt('mode','m','Define the mode of execution:\n\t'+
            'waitfinish: wait for click of finish button or get sended to /finish\n\t'+
            'waitSucess: does not end the test while passing all tests')){
                var value = value.toLowerCase()
                switch(value){
                    case "waitfinish":
                        mode = "waitFinish";
                        break;
                    case "waitsucess":
                        mode = "waitSucess";
                        break;
                    default:
                        throw new Error("Invalid mode");
                }
            }
            if(opt('view','v','disable headless mode from puppeter')){
                headless = false;
            }
            if(opt('open-only',null,'don\'t generate the results in terminal')){
                returnTestResult = false;
            }
            if(opt('server-only','s',"do not open puppeter")){
                runWebDriver = false;
            }
            if(opt('exec','e',"execute the command after opened server")){
                if(value){
                    execCmd = value;
                }
            }
            if(opt('help','h','show the list of args')){
                console.log("Help\n case the opt need some value pass the value following the rule: \"<arg>=<value>\"\n\n");
                for(const desc of descs){
                    console.log(desc);
                }
                finish = true;
            }
            function opt(full,min,desc){
                const isFull = ("--"+full) === type;
                const isMin = min ? ("-"+min) === type : false;
                for(var actual = full.length; actual < 11;actual++){
                    full+=" ";
                }

                descs.push(`--${full}${min ? "|-"+min:"|--"} ${desc}`);
                return (isFull || isMin);
            };
        });
        if(finish){
            return;
        }
        console.log("[TEST] to get help from test workbanch pass arg with \"--args=-h\"");
    }
    console.log("[TEST] starting test,port="+port);
    await startServer();
    if(runWebDriver){
        await startBrowser();
    }
    if(execCmd){
        exec(execCmd, (error, stdout, stderr) => {
            if(error){
                console.log("[TEST] Failed executing \""+execCmd+"\"" + " error:"+error.message);
            }
        });
    }
}
function processFinish(){
    if(server){
        server.close();
    }
    if(browser){
        browser.close().then(run);
    }else{
        run();
    }
}
function startServer(){
    return new Promise((res)=>{
        app.get("/finish",(req,res)=>{
            console.log("[SERVER] Process ordened to finish");
            res.status(200).end();
            setImmediate(processFinish)
        })
        app.post("/info",(req,res)=>{
            console.log("[SERVER] Receiving data from frontend");
            var data = req.body;
            if(!data){
                console.error("[SERVER] Invalid data returned");
            }else{
                var test_info =data.data;
                if(data.status === "ok"){
                    const failures = test_info.stats.failures;
                    if(mode === "waitSucess" && failures != 0){
                        console.log(`[SERVER] Have ${failures} failures, waiting for success`);
                    }else{
                        makeSuite(test_info.suite);
                        if(mode !== "waitFinish"){
                            setImmediate(processFinish);
                        }else{
                            console.log("[SERVER] data received with success,waiting calling /finish path");
                        }
                    }
                }else{
                    console.error(data.error);
                    if(mode != "waitSucess" && mode != "waitFinish")
                        setImmediate(processFinish);
                }
            }
            res.status(200).end();
        })
        server = app.listen(port,()=>{
            console.log("[SERVER] Server started! url:htpp://localhost:"+port+"/index.html");
            res();
        });
    })
}
async function startBrowser(){
    const INDEX_URL = "http://localhost:"+port+"/index.html"
    browser =await puppeteer.launch({headless});
    console.log("[HEADLESS BROWSER] browser started");
    const page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 720 });
    console.log("[HEADLESS BROWSER] Opening " +INDEX_URL);
    await page.goto(INDEX_URL);
    console.log("[HEADLESS BROWSER] opened, waiting server");
}
function makeSuite(suite){
    if(!returnTestResult){
        return;
    }
    if(suite.root){
        if(suite.tests){
            makeTest(suite.tests);
        };
        if(suite.suites){
            for(const act of suite.suites){
                makeSuite(act);
            }
        }
    }else{
        describe(suite.title,()=>{
            if(suite.tests){
                makeTest(suite.tests);
            }
            if(suite.suites){
                for(const act of suite.suites){
                    makeSuite(act);
                }
            }
        })
    }
    function makeTest(tests){
        for(const test of tests){
            it(test.title,function(){
                if(test.state === "failed"){
                    var message = test.err.message;
                    delete test.err.name,test.err.message;
                    var a = new chai.AssertionError(message,test.err);
                    throw a
                }else{
                    if(test.state === "pending"){
                        this.skip();
                    }else{
                        assert.ok(test.state === "passed",test.err);
                    }
                }
            })
        };
    }
}