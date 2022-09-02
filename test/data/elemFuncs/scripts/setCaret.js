test.setCaret(document.getElementById("elem"),13);

var range = document.createRange()
var sel = window.getSelection()
var caretPos = null;
if (sel.rangeCount) {
    range = sel.getRangeAt(0);
    caretPos = range.endOffset;
}
var result = sel.focusNode === document.getElementById("mark").childNodes[0] && caretPos === 1;
console.debug("$END$"+result);