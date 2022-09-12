"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeTextSearch = exports.getLocalPosition = exports.buildElemPath = exports.setCaret = exports.getLocalPath = exports.setCaretToEnd = exports.moveInEveryNode = exports.getDataFromPosition = exports.splitElem = exports.replace = exports.getStartChild = exports.getEndChild = exports.getCaretPosition = void 0;
const tags = require("./tags");
function getDataFromPosition(elem, position) {
    var node = null;
    var actualPos = 0;
    var localPos = 0;
    var actualNodePos = 0;
    moveInEveryNode(elem, el => {
        actualPos += el.textContent.length;
        if (actualPos >= position) {
            localPos = el.textContent.length - (actualPos - position);
            node = el;
            return false;
        }
        actualNodePos++;
    });
    return {
        node,
        localPosition: localPos,
        index: actualNodePos
    };
}
exports.getDataFromPosition = getDataFromPosition;
function splitElem(elem, pos) {
    var elem1 = elem.cloneNode(true);
    var elem2 = elem.cloneNode(true);
    function defOperation(actualElem, moveIn, substring) {
        var cutIn;
        var actualPos = 0;
        var removeTexts = [];
        var removeClearElems = [];
        moveInEveryNode(actualElem, e => {
            actualPos += e.textContent.length;
            if (actualPos >= pos) {
                cutIn = e;
                var textPos = e.textContent.length - (actualPos - pos);
                cutIn.textContent = substring(cutIn, textPos);
                return false;
            }
        });
        moveInEveryNode(actualElem, e => {
            if (e === cutIn) {
                return false;
            }
            ;
            removeTexts.push(e);
        }, moveIn);
        for (const e of removeTexts) {
            e.remove();
        }
        ;
        return actualElem;
    }
    return [
        defOperation(elem1, "end", (el, textPos) => el.textContent.substring(0, textPos)),
        defOperation(elem2, "start", (el, textPos) => el.textContent.substring(textPos))
    ];
}
exports.splitElem = splitElem;
function getLocalPath(elem, hint) {
    var endElem = typeof hint === "number" ? getElemFromPosition(hint) : hint;
    var sequence = [endElem];
    var actualElem = endElem.parentElement;
    while (actualElem != elem) {
        sequence.push(actualElem);
        actualElem = actualElem.parentElement;
    }
    ;
    return sequence.reverse();
    function getElemFromPosition(pos) {
        var node = getDataFromPosition(elem, pos).node;
        return node instanceof Element ? node : node.parentElement;
    }
}
exports.getLocalPath = getLocalPath;
function buildElemPath(elems, insert) {
    var elemsCopy = elems.map(elem => {
        var clonedElem = elem.cloneNode(false);
        clonedElem[tags.markFormat] = elem[tags.markFormat];
        return clonedElem;
    });
    elemsCopy.push(insert);
    elemsCopy.reduce((prev, current) => {
        return prev.appendChild(current);
    });
    return elemsCopy[0];
}
exports.buildElemPath = buildElemPath;
const getCaretPosition = function () {
    var lastPosition = null, lastNode = null, lastTruePosition;
    function get(elem) {
        var caretPos = 0, sel, range, nodeFocused, truePosition = 0;
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.rangeCount) {
                range = sel.getRangeAt(0);
                nodeFocused = sel.focusNode;
                caretPos = range.endOffset;
            }
        }
        ;
        if (lastPosition === caretPos && lastNode === nodeFocused) {
            console.log("Skipping calculate....");
            return lastTruePosition;
        }
        ;
        lastPosition = caretPos;
        lastNode = nodeFocused;
        moveInEveryNode(elem, actualElem => {
            if (actualElem === nodeFocused) {
                truePosition += caretPos;
                return false;
            }
            ;
            truePosition += actualElem.textContent.length;
        });
        lastTruePosition = truePosition;
        return truePosition;
    }
    return get;
}();
exports.getCaretPosition = getCaretPosition;
function moveInEveryNode(elem, callback, startIn = "start") {
    var actualNode = elem;
    var lastPositions, plusSignal, logicalMode, startingPos;
    if (startIn === "start") {
        plusSignal = 1;
        logicalMode = (actualPos, length) => actualPos < length;
        startingPos = (length) => -1;
        lastPositions = [-1];
    }
    else if (startIn === "end") {
        plusSignal = -1;
        logicalMode = (actualPos, length) => actualPos >= 0;
        startingPos = (length) => length;
        lastPositions = [elem.childNodes.length];
    }
    while (lastPositions.length > 0) {
        var actualPos = lastPositions.pop();
        if (actualPos === undefined) {
            break;
        }
        ;
        actualPos += plusSignal;
        lastPositions.push(actualPos);
        if (logicalMode(actualPos, actualNode.childNodes.length)) {
            actualNode = actualNode.childNodes[actualPos];
            lastPositions.push(startingPos(actualNode.childNodes.length));
        }
        else {
            lastPositions.pop();
            if (actualNode.childNodes.length > 0) {
                actualNode = actualNode.parentNode;
                continue;
            }
            if (elem === actualNode) {
                break;
            }
            var ret = callback(actualNode);
            actualNode = actualNode.parentNode;
            if (ret === false) {
                break;
            }
        }
    }
}
exports.moveInEveryNode = moveInEveryNode;
function setCaretToEnd(elem) {
    var end = getEndChild(elem);
    setSelection(end, end.textContent.length);
}
exports.setCaretToEnd = setCaretToEnd;
function getEndChild(elem) {
    return repeat(elem);
    function repeat(elemToSearch) {
        var childs = elemToSearch.childNodes;
        if (childs.length > 0) {
            return repeat(childs[childs.length - 1]);
        }
        else {
            return elemToSearch;
        }
    }
}
exports.getEndChild = getEndChild;
function getStartChild(elem) {
    var actualChild = elem;
    while (actualChild.childNodes.length > 0) {
        actualChild = actualChild.childNodes[0];
    }
    ;
    return actualChild;
}
exports.getStartChild = getStartChild;
function getLocalPosition(ref, data) {
    var actualPosition = 0;
    moveInEveryNode(ref, e => {
        if (e === data.node) {
            actualPosition += data.localPosition;
            return false;
        }
        else {
            actualPosition += e.textContent.length;
        }
    });
    return actualPosition;
}
exports.getLocalPosition = getLocalPosition;
/**
 * Pass Every node
 */
function setCaret(elem, pos) {
    var el = elem;
    var contLoc = 0;
    var trueLoc = pos;
    var child = contChilds(el);
    setSelection(child, trueLoc);
    function contChilds(elemToCont) {
        if (elemToCont.childNodes.length == 0) {
            const textLength = elemToCont.textContent.length;
            contLoc += textLength;
            if (trueLoc > textLength) {
                trueLoc -= textLength;
            }
        }
        ;
        if (contLoc >= pos) {
            return elemToCont;
        }
        for (const actualChild of elemToCont.childNodes) {
            var res = contChilds(actualChild);
            if (res)
                return res;
        }
    }
    ;
    function getNextSibling(startIn) {
        var next = startIn.nextSibling;
        if (!next) {
            if (startIn.parentElement != elem) {
                return getNextSibling(startIn.parentElement);
            }
            else {
                return null;
            }
        }
        return next;
    }
}
exports.setCaret = setCaret;
//TODO make system to replace various nodes case matched text is in diferent locations
function replace(elem, searchValue, replaceValue, ops) {
    if (typeof searchValue === "string" || searchValue instanceof RegExp)
        textReplacing(searchValue);
    function textReplacing(text) {
        const position = elem.textContent.search(text);
        var fullPosition = 0;
        var fullText = "";
        var nodes = [];
        if (position == -1)
            return;
        moveInEveryNode(elem, actualNode => {
            var actualText = actualNode.textContent;
            fullPosition += actualText.length;
            if (fullPosition >= position) {
                fullText += actualText;
                nodes.push(actualNode);
                var isInFragment = actualText.search(text) != -1;
                var isInFullText = fullText.search(text) != -1;
                var isInActualNode = isInFragment && (!isInFullText || fullText === actualText);
                if (isInActualNode) {
                    var replaceText = typeof text === "string" ? text : actualText.match(text)[0];
                    if (typeof replaceValue === "string")
                        actualNode.textContent = actualText.replace(replaceText, replaceValue);
                    else {
                        var parent = actualNode.parentNode;
                        parent.insertBefore(replaceValue, actualNode);
                        parent.removeChild(actualNode);
                    }
                    ;
                    return false;
                }
                else {
                    if (isInFullText) {
                        var multiNodeSearch = nodeTextSearch();
                        for (const node of nodes) {
                            multiNodeSearch.add(node);
                        }
                        ;
                        var result = multiNodeSearch.location(text);
                        if (!result) {
                            return false;
                        }
                        var startNode = result.start.node;
                        var endNode = result.end.node;
                        for (const elem of result.elems) {
                            elem.parentElement.removeChild(elem);
                        }
                        ;
                        startNode.textContent = startNode.textContent.substring(0, result.start.localPos);
                        endNode.textContent = endNode.textContent.substring(result.end.localPos);
                        put(startNode, replaceValue);
                    }
                }
            }
            ;
        });
    }
    function put(nodeToPut, putIt) {
        if (typeof putIt == "string") {
            nodeToPut.textContent += putIt;
        }
        else {
            nodeToPut.parentElement.insertBefore(putIt, nodeToPut.nextSibling);
        }
    }
}
exports.replace = replace;
function nodeTextSearch() {
    var nodes = [];
    var nodeEnd = [];
    var fullText = "";
    var totalLength = 0;
    return {
        add(node) {
            totalLength += node.textContent.length;
            nodes.push(node);
            nodeEnd.push(totalLength);
            fullText += node.textContent;
        },
        search(searchFor) {
            return fullText.search(searchFor);
        },
        location(searchFor) {
            var startPos = typeof searchFor == "string" ? fullText.indexOf(searchFor) : fullText.search(searchFor);
            if (startPos === -1)
                return false;
            var lengthMatchedText = typeof searchFor === "string" ? searchFor.length : fullText.match(searchFor)[0].length;
            var start = position(startPos);
            var end = position(startPos + lengthMatchedText);
            runPosition(start, compareMode(">"));
            runPosition(end, compareMode(">=")); //fix getting last position
            var sendElems = [];
            for (var index = start.index + 1; index <= end.index - 1; index++) {
                sendElems.push(nodes[index]);
            }
            return {
                start,
                end,
                elems: sendElems
            };
            function position(starting) {
                return {
                    node: null,
                    localPos: 0,
                    startIn: starting,
                    index: -1
                };
            }
            function runPosition(pos, evaluator) {
                for (var cont = 0; nodeEnd.length > cont; cont++) {
                    const actualLength = nodeEnd[cont];
                    if (evaluator(actualLength, pos.startIn)) {
                        pos.index = cont;
                        pos.node = nodes[cont];
                        const lastValue = cont != 0 ? nodeEnd[cont - 1] : 0;
                        const length = actualLength - lastValue;
                        pos.localPos = length - (actualLength - pos.startIn);
                        break;
                    }
                }
            }
            function compareMode(mode = ">") {
                if (mode == ">") {
                    return (a, b) => {
                        return a > b;
                    };
                }
                ;
                if (mode == ">=") {
                    return (a, b) => {
                        return a >= b;
                    };
                }
            }
        }
    };
}
exports.nodeTextSearch = nodeTextSearch;
/**
 * Set the cursor location in actual element
 */
function setSelection(child, loc) {
    var range = document.createRange();
    var sel = window.getSelection();
    range.setStart(child, loc);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
}
