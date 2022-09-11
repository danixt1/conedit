module.exports = {
    /**
     * Turn the function in compatible new Function() statement
     * @param {Function} func 
     * @param  {...string} args 
     * @returns {String[]}
     */
    createStringFunc(func,...args){
        const funcString = func.toString();
        const funcName = func.name;
        const argsParam = args.length > 0 ? args.reduce((p,c)=>p+","+c) : "";
        const funcCall = `return ${funcName}(${argsParam})`;
        return [...args,funcString+";"+funcCall];
    }
}