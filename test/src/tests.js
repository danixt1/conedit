(()=>{
    const $ = (query)=>document.querySelector(query);
    var _testName;
    var elemExecTest = $("#execTest");
    var testInput = $("#testInput");
    var elems = {
        TestName:$("#execTestName"),
        completedTests:$("#completedTests"),
        testsToExec:$("#testToExecute")
    }
    /**@type {Array<()=>Array<{testName:string,passed:boolean,error:string}>} */
    var actualTest = null;
    var vals = {
        testName:"",
        scriptToTest:"",
        execfuncs:[],
        delay:0
    }
    var convertRawInput = {
        testName:(raw)=>raw.replace(/\s/g,""),
        scriptToTest:(raw)=>{
            raw ="tests/"+raw.replace(/\s/g,"");
            return raw.endsWith(".js") ? raw.substring(0,raw.length - 3) : raw
        },
        execfuncs:(raw)=>raw.replace(/\s/g,"") === "*" ? null : raw.replace(/\s/g,"").split(/[,;]/),
        delay:(raw)=>raw.length > 0 ? Number.parseInt(raw) : 0
    }
    elemExecTest.onclick = ()=>{
        process(testInput.getElementsByTagName("input"));
    }
    /**
     * @param {HTMLInputElement[]} inputs 
     */
    function process(inputs){
        var props = {};
        for(const elem of inputs){
            props[elem.id] = elem.value;
        };
        for(const [name,func] of Object.entries(convertRawInput)){
            vals[name] = func(props[name])
        };
        console.log(vals);
    }
    async function startExecution(){
        /**@type {{funcName:string,tests:{testName:string, passed:boolean,error:string}[]}[]} */
        var testStatus = {};
        if(!actualTest){
            return null;
        }
        setTestName(_testName);
        setTestsToExec(actualTest.length);

        await sleep(vals.delay);

        for(const func of actualTest){
            var data = {funcName:func.name,tests:func()};
            testStatus.push(data);
            await sleep(vals.delay);
            setTestsAlreadyExecuted(testStatus.length);
        };
        return testStatus;
        function sleep(mlsecs){
            return new Promise(resolve =>{
                if(Number.isNaN(mlsecs))
                    resolve();

                setTimeout(()=>{
                    resolve()
                },mlsecs);
            })
        }
    }
    /**
     * Used by test attached in element
     * @param {{[index:string]:()=>Array<{testName:string,passed:boolean,error:string}>} test 
     */
    async function insertTest(test,testName){
        if(typeof test != "object"){
            throw "Invalid Inserted test, not is object";
        };
        actualTest = test;
        _testName = testName;
    }
    function setTestName(name){
        elems.TestName.innerText = name;
    }
    function setTestsToExec(value){
        elems.testsToExec.innerText = value;
    }
    function setTestsAlreadyExecuted(value){
        elems.completedTests.innerText = value;
    }
    function loadScript(loc){
        var scriptTag = document.createElement("script");
        return new Promise((resolve,reject) =>{
            scriptTag.onerror = (e)=>{
                reject(e);
            }
            scriptTag.onload = ()=>{
                resolve();
            }
            scriptTag.src = loc;
            document.appendChild(scriptTag).remove();
        })
    }
    window.insertTest = insertTest;
})()