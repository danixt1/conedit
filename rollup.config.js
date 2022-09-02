import commonJs from "@rollup/plugin-commonjs";
export default[{
    input:"builds/src/index.js",
    output:{
        file:"builds/self/iife.js",
        format:"iife",
        name:"ContentEditable"
    },
    plugins:[commonJs()]
}]