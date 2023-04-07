//var express = require("express");
import express from "express";
var app = express();
//var puppeter = require("puppeteer");
import puppeteer  from "puppeteer";
import {join} from "path";
import assert from "assert";
import * as mocha from "mocha";
import * as chai from "chai";
/**@type {"default"|"waitSucess"|"view"} */
var mode = "default";
app.use(express.json());
app.use(express.static(join("test","page")));
app.use("/lib",express.static(join("lib")));
app.use("/mocha",express.static(join("node_modules","mocha")));
app.use("/chai",express.static(join("node_modules","chai")));

function start(end){
    var processFinish = ()=>{throw "Function not overrided"};
    var port = 7000;
    process.argv.forEach(e =>{
        var [type,value] = e.split("=");
        if(type === "--port" || type === "-p"){
            port = Number(value) || port;
        }
        if(type === "--mode" || type === "-m"){
            if(value.toLowerCase() === "waitsucess"){
                mode = "waitSucess";
            };
            if(value.toLowerCase() === "view"){
                mode = "view";
            }
        }
    });
    console.log("[TEST] starting test,port="+port);
    app.post("/info",(req,res)=>{
        //req.body;
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
                    setImmediate(processFinish);
                }
            }else{
                console.error(data.error);
                if(mode != "waitSucess")
                    setImmediate(processFinish);
            }
        }
        function makeSuite(suite){
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
        res.status(200).end();
    })
    var server = app.listen(port);
    startBrowser();
    async function startBrowser(){
        const INDEX_URL = "http://localhost:"+port+"/index.html"
        var browser =await puppeteer.launch({headless:mode != "view"});
        console.log("[HEADLESS BROWSER] browser started");
        const page = await browser.newPage();
        await page.setViewport({ width: 1024, height: 720 });
        console.log("[HEADLESS BROWSER] Opening " +INDEX_URL);
        processFinish = ()=>{
            server.close();
            browser.close().then(end);
        }
        await page.goto(INDEX_URL);
        console.log("[HEADLESS BROWSER] opened, waiting server");
    }
}
start(()=>{run()});