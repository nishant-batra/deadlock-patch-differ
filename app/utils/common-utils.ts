export const replaceHighlight=(val:string)=>{
return val.replaceAll("highlight","font-bold text-white");
}

export const replaceDiminish=(val:string)=>{
    return val.replaceAll("diminish",'italic text-sm text-gray-400')
}