//var express = require("express");
import express from "express";
var app = express();
//var puppeter = require("puppeteer");
import puppeteer  from "puppeteer";
import {join} from "path";
import assert from "assert";

app.use(express.json());
app.use(express.static(join("test","page")));
app.use("/lib",express.static(join("lib")));

function start(end){
    var processFinish = ()=>{throw "Function not overrided"};
    var port = 7000;
    process.argv.forEach(e =>{
        var [type,value] = e.split("=");
        if(type === "port" || type === "-p"){
            port = Number(value) || port;
        }
    });
    console.log("starting test,port="+port);
    app.post("/info",(req,res)=>{
        //req.body;
        console.log("data passed from frontend,process finished");
        var data = req.body;
        if(!data){
            console.error("Invalid data returned");
        }else{
            makeSuite(data.suite);
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
                        assert.ok(test.state == "passed",test.err?.message);
                    })
                };
            }
        }
        setImmediate(processFinish);
        res.status(200).end();
    })
    var server = app.listen(port);
    startBrowser();
    async function startBrowser(){
        const INDEX_URL = "http://localhost:"+port+"/index.html"
        var browser =await puppeteer.launch({headless:true});
        console.log("browser started");
        const page = await browser.newPage();
        await page.setViewport({ width: 1024, height: 720 });
        console.log("Opening " +INDEX_URL);
        processFinish = ()=>{
            server.close();
            browser.close().then(end);
        }
        await page.goto(INDEX_URL);
        console.log("opened, waiting server");
    }
}
start(()=>{run()});