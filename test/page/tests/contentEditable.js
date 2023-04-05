import contentEditable from "/lib/contentEditable.js";
const MAIN_CONTENT_ID = "content";
var assert = chai.assert;
var $cont = $("#"+MAIN_CONTENT_ID);

describe("contentEditable.js",function(){
    var content;
    beforeEach(()=>{
        $cont.html();
        content = new contentEditable($cont.get(0));
    })
    describe("[instance].append()",()=>{
        const ELEM_TEXT = "any";
        const TEXT_ELEMS_TO_ADD = [" other"," more"];
        it("Cursor location not changed",()=>{
            $cont.html(ELEM_TEXT);
            content.caretPosition = 2;
            content.append(...TEXT_ELEMS_TO_ADD.map(e=>{
                var b = document.createElement("b");
                b.innerText = e;
                return b;
            }));
            var result = content.caretPosition;
            assert.strictEqual(result,2);
        });
        it("add elems",()=>{
            $cont.html(ELEM_TEXT);
            content.caretPosition = 1;
            content.append(...TEXT_ELEMS_TO_ADD.map(e=>{
                var b = document.createElement("b");
                b.innerText = e;
                return b;
            }));
            var result = $cont.text();
            assert.strictEqual(result,ELEM_TEXT + TEXT_ELEMS_TO_ADD.join(""));
        });
    })
});