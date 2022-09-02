"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathChanger = void 0;
const eventsFuncs_1 = require("./eventsFuncs");
class listener {
    constructor(content, eventData, eventType) {
        this.isAlreadyAdded = false;
        var listener = eventData.listener;
        var sendListener = (e) => {
            listener(content, e);
        };
        this.listener = sendListener;
        this.content = content;
        this.eventName = eventType;
        this.dataEvent = eventData;
    }
    remove() {
        if (this.isAlreadyAdded) {
            this.isAlreadyAdded = false;
            this.content.removeEventListener(this.eventName, this.listener);
        }
    }
    add() {
        if (!this.isAlreadyAdded) {
            this.isAlreadyAdded = true;
            this.content.addEventListener(this.eventName, this.listener);
        }
    }
}
class PathChanger extends listener {
    constructor(content) {
        super(content, (0, eventsFuncs_1.pathChangerEvent)(), "keypress");
    }
    set path(path) {
        this.dataEvent.path = path;
    }
    get path() {
        return this.dataEvent.path;
    }
}
exports.PathChanger = PathChanger;
