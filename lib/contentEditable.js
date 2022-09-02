"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const elemFuncs_1 = require("./elemFuncs");
const tags_1 = require("./tags");
const events = require("./contentListeners");
;
class contentEditable {
    constructor(content, ops = {}) {
        this.path = [];
        var pathChanger = new events.PathChanger(this);
        this.eventPathChanger = pathChanger;
        if (!content.contentEditable)
            throw "Passed Element not is contentEditable";
        this.content = this[tags_1.contentTag] = content;
        if (ops.isFixedTextPath) {
            pathChanger.add();
        }
        ;
        this.ops = ops;
    }
    append(...elems) {
        let lastPosition = this.caretPosition;
        let lastLength = this.content.textContent.length;
        elems.forEach(e => this.content.appendChild(e));
        if (lastPosition === lastLength) {
            (0, elemFuncs_1.setCaretToEnd)(this.content);
        }
        else {
            this.caretPosition = lastPosition;
        }
    }
    appendChild(elem) {
        this.append(elem);
        return elem;
    }
    insertInPosition(elem, position) {
        var info = (0, elemFuncs_1.getDataFromPosition)(this.content, position);
        var elemToSplit = info.node;
        while (elemToSplit.parentElement != this.content) {
            elemToSplit = elemToSplit.parentElement;
        }
        ;
        var elems = (0, elemFuncs_1.splitElem)(elemToSplit, (0, elemFuncs_1.getLocalPosition)(elemToSplit, info));
        var insertOrder = [elems[0], elem, elems[1]];
        insertOrder.forEach(e => {
            this.content.insertBefore(e, elemToSplit);
        });
        this.content.removeChild(elemToSplit);
    }
    replace(searchValue, replaceValue) {
        (0, elemFuncs_1.replace)(this.content, searchValue, replaceValue);
    }
    get caretPosition() {
        return (0, elemFuncs_1.getCaretPosition)(this.content);
    }
    get textPath() {
        if (this.ops.isFixedTextPath) {
            return this.path;
        }
        return (0, elemFuncs_1.getLocalPath)(this.content, this.caretPosition);
    }
    set textPath(elems) {
        if (this.ops.isFixedTextPath) {
            elems.forEach(elem => {
                elem[tags_1.markFormat] = Symbol("Family Mark");
            });
            this.path = elems;
            this.eventPathChanger.path = elems;
        }
    }
    get isFixedTextPath() {
        return this.ops.isFixedTextPath;
    }
    set isFixedTextPath(val) {
        this.ops.isFixedTextPath = val;
        if (!val) {
            this.eventPathChanger.remove();
        }
        else {
            this.eventPathChanger.add();
        }
    }
    set caretPosition(position) {
        (0, elemFuncs_1.setCaret)(this.content, position);
    }
    addEventListener(event, listener, options) {
        var execFunc = typeof listener === "function" ? listener : listener.handleEvent;
        var newfunc = (event) => {
            setTimeout(execFunc, 0, event);
        };
        listener = typeof listener === "function" ? newfunc : { handleEvent: newfunc };
        this.content.addEventListener(event, listener, options);
    }
    removeEventListener(type, listener, options) {
        this.content.removeEventListener(type, listener, options);
    }
}
;
exports.default = contentEditable;
