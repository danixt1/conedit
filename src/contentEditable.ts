import {getCaretPosition,setCaret,setCaretToEnd,getDataFromPosition,splitElem,getLocalPosition,replace} from "./elemFuncs.js"
//Add the options from the content
interface ContentEditableOps {
};
class contentEditable implements Pick<HTMLElement,'addEventListener'>{
    private content:HTMLElement
    private ops:ContentEditableOps

    constructor(content:HTMLElement,ops:ContentEditableOps = {}){
        if(!content.contentEditable)
            throw "Passed Element not is contentEditable";
        this.content = content;
        this.ops = ops;
    }
    addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: any, options?: unknown): void {
        var execFunc = typeof listener === "function" ? listener : listener.handleEvent;
        var newfunc = (event)=>{
                setTimeout(execFunc,0,event);
        };
        listener = typeof listener === "function" ? newfunc : {handleEvent:newfunc};
        this.content.addEventListener(type,listener,options);
    }
    append(...elems:Node[]){
        let lastPosition = this.caretPosition;
        let lastLength = this.content.textContent.length;

        elems.forEach(e => this.content.appendChild(e));

        if(lastPosition === lastLength){
            setCaretToEnd(this.content);
        }else{
            this.caretPosition = lastPosition;
        }
    }
    appendChild<T extends Node>(elem:T){
        this.append(elem);
        return elem;
    }
    insertInPosition(elem:Node,position:number){
        var info = getDataFromPosition(this.content,position);
        var elemToSplit = info.node;
        
        while(elemToSplit.parentElement != this.content){
            elemToSplit = elemToSplit.parentElement;
        };
        var elems = splitElem(elemToSplit,getLocalPosition(elemToSplit,info));
        var insertOrder = [elems[0],elem,elems[1]];
        insertOrder.forEach(e =>{
            this.content.insertBefore(e,elemToSplit);
        });
        this.content.removeChild(elemToSplit);
    }
    replace(searchValue:string | RegExp,replaceValue:string | Node){
        replace(this.content,searchValue,replaceValue);
    }
    get caretPosition(){
        return getCaretPosition(this.content);
    }
    set caretPosition(position:number | null){
        if(position === null){
            setCaretToEnd(this.content);
        }else{
            setCaret(this.content,position);
        }
    }
    on(event:string,listener:EventListenerOrEventListenerObject,options?:boolean | AddEventListenerOptions){
        this.addEventListener(event,listener,options);
    }
    removeEventListener(type: keyof HTMLElementEventMap,listener:EventListenerOrEventListenerObject,options?:boolean | AddEventListenerOptions){
        this.content.removeEventListener(type,listener,options);
    }
}
declare global{
    type ContentEditable =contentEditable
}
export default contentEditable;