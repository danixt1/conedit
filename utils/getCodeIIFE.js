var rollup = require("rollup");
var commonJs = require("@rollup/plugin-commonjs");

module.exports =get

async function get(filename,exportsWithName = "rollup"){
    var bundle = await rollup.rollup({
        input:filename,
        plugins:[commonJs()]
    });
    const {output} =await bundle.generate({format:"iife",name:exportsWithName,exports:"named"});
    for(const chunck of output){
        if(chunck.type != "chunk")
            continue;
        return chunck.code;
    }
}