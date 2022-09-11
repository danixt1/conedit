/**
 * @class
 */
class makeTest{
    #contentId;
    #textAppend;
    #funcDetail;
    #page;
    #testName
    constructor(contentId = "elem",page,testName = ""){
        this.#contentId = contentId;
        this.#page = page;
        this.#testName = testName;
    }
    append(text){
        this.#textAppend = text;
    }
    testFunc(func,...args){
        this.#funcDetail = [func,args];
    }
    async start(){
        var page =this.#page;
        await page.waitForSelector("#"+this.#contentId);
        //Put the text from the append function in indicated id
        await page.evaluate((innerHtml,id)=>{
            var elem = document.getElementById(id);
            elem.innerHTML = innerHtml;
        },this.#textAppend,this.#contentId);
        var reponse = await page.evaluate(this.#funcDetail[0],...this.#funcDetail[1]);

        return reponse;
    }
}
module.exports = makeTest;