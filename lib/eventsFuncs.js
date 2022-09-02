"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathChangerEvent = void 0;
const elemFuncs_1 = require("./elemFuncs");
const tags_1 = require("./tags");
function pathChangerEvent() {
    var mappedPath;
    return {
        listener,
        set path(setThis) {
            mappedPath = setThis;
        }
    };
    function listener(content, event) {
        var actualCaretPos = content.caretPosition;
        var startIn = null;
        var compareTo = (0, elemFuncs_1.getLocalPath)(content[tags_1.contentTag], actualCaretPos);
        for (const key in mappedPath) {
            var path1 = mappedPath[key];
            var path2 = compareTo[key];
            var isDifferent = path1[tags_1.markFormat] && path2[tags_1.markFormat] ? path1[tags_1.markFormat] != path2[tags_1.markFormat] : path1 != path2;
            if (isDifferent) {
                startIn = key;
                break;
            }
            ;
        }
        ;
        if (!startIn) {
            return;
        }
        ;
        var dataInfo = (0, elemFuncs_1.getDataFromPosition)(content[tags_1.contentTag], actualCaretPos);
        var lastElem = dataInfo.node;
        var text = lastElem.textContent;
        var textPart1 = text.substring(0, dataInfo.localPosition - 1);
        var textPart2 = text.substring(dataInfo.localPosition);
        lastElem.textContent = textPart1 + textPart2;
        var insert = (0, elemFuncs_1.buildElemPath)(mappedPath, document.createTextNode(event.key));
        content.insertInPosition(insert, actualCaretPos - 1);
        content.caretPosition = actualCaretPos;
    }
}
exports.pathChangerEvent = pathChangerEvent;
