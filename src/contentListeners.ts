import {pathChangerEvent} from "./eventsFuncs"
class listener{
    private listener:(e:Event)=>void
    private content:ContentEditable
    private eventName:keyof HTMLElementEventMap
    private isAlreadyAdded:boolean = false;
    protected dataEvent:eventObject
    constructor(content:ContentEditable,eventData:eventObject,eventType:keyof HTMLElementEventMap){
        var listener = eventData.listener;
        var sendListener = (e:Event)=>{
            listener(content,e)
        }
        this.listener = sendListener
        this.content = content;
        this.eventName = eventType;
        this.dataEvent = eventData;
    }
    remove(){
        if(this.isAlreadyAdded){
            this.isAlreadyAdded = false;
            this.content.removeEventListener(this.eventName,this.listener)
        }
    }
    add(){
        if(!this.isAlreadyAdded){
            this.isAlreadyAdded = true;
            this.content.addEventListener(this.eventName,this.listener)
        }
    }
}
class PathChanger extends listener{
    constructor(content:ContentEditable){
        super(content,pathChangerEvent(),"keypress");
    }
    set path(path:Element[]){
        this.dataEvent.path = path;
    }
    get path(){
        return this.dataEvent.path;
    }
}
declare global{
    interface eventObject{
        listener:(content:ContentEditable,event:Event)=>void,
        [index:string]:any;
    }
    type ListenerEditable = listener
}
export {
    PathChanger,
}