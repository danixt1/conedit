import {opendirSync,readFileSync,writeFileSync} from "fs";
import {join} from "path"
const RULE = /(?<![\w|'|"| ])import (.*) from ["|'](.+)["|']/g;
executeInDir("lib");
function executeInDir(path){
    var dir = opendirSync(path);
    var dirent;
    while(dirent = dir.readSync()){
        const ACTUAL_PATH = join(path,dirent.name)
        if(dirent.isDirectory()){
            executeInDir(ACTUAL_PATH);
        }else{
            if(dirent.isFile() && dirent.name.endsWith(".js")){
                var file = readFileSync(ACTUAL_PATH,{encoding:"utf-8"});
                file = file.replace(RULE,'import $1 from "$2.js"');
                writeFileSync(ACTUAL_PATH,file);
            };
        }
    };
    dir.closeSync();
}