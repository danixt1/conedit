export const INTERNAL_ERROR = "INTERNAL_ERROR";//sended when not the test failed but the EXECUTION from the test
export const TEST_FAILED = "TEST_FAILED";//The test is correct executed but failed with has expected.

const CHECK_LOCAL_DIR = /(?<=http:\/\/(\w|\.|:)+\/)(\w+)/;
const REPLACE_URL_TO_PATH =/(^.+at|^fail) http:\/\/\w+(:\d+|\.\w+)*\/(([\w\/.:])+)/;

export function getRelativeErrorLocation(stack){
    var errorLoc =stack ? stack.split("\n")[3] : new Error().stack.split("\n")[3];
    if(errorLoc.match(CHECK_LOCAL_DIR)[0] === "tests"){
        errorLoc = errorLoc.replace(REPLACE_URL_TO_PATH,"file://test/page/$3");
    }else{
        errorLoc = errorLoc.replace(REPLACE_URL_TO_PATH,"file://lib/$3");
    }
    return errorLoc;
}
export function assertFail(message){
    chai.assert.ok(false,TEST_FAILED+":"+message+ "\n in "+getRelativeErrorLocation());
}
export function fail(data){
    var backMessage;
    if(data instanceof Error){
        backMessage = INTERNAL_ERROR+":"+data.message+ "\n in "+getRelativeErrorLocation(data.stack);
    }else{
        backMessage = INTERNAL_ERROR+":"+data+ "\n in "+getRelativeErrorLocation();
    }
    $.ajax({
        dataType:"json",
        contentType: "application/json",
        url:"/info",
        data:JSON.stringify({status:"failed",error:backMessage}),
        method:"POST"
    })
    throw new Error(backMessage);
}