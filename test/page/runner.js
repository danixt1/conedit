import "/tests/elemFuncs.js";
var data = mocha.run();
var interval = setInterval(checkEnd,50);
function checkEnd(){
    if(data.state != "running"){
        $.ajax({
            dataType:"json",
            contentType: "application/json",
            url:"/info",
            data:JSON.stringify(getResult(data)),
            method:"POST"
        })
        clearInterval(interval);
    };
}
//Transform data to possibilite the stringify
function getResult(data){
    return {
        stats:data.stats,
        suite: getSuite(data.suite)
    }
    function getSuite(suite){
        return {
            title:suite.title,
            root:suite.root,
            tests:suite.tests.length > 0 ?suite.tests.map(e=>getTest(e)) : [],
            suites:suite.suites.length > 0 ?suite.suites.map(e=>getSuite(e)) : []
        }
    }
    function getTest(test){
        return getProps(["sync","type","timedOut","title","state","duration","speed","err"],test);
    }
    function getProps(props,from){
        var obj = {};
        props.forEach(e =>{obj[e] = from[e]});
        return obj;
    }
}