import type { Item,ItemSlotType } from "#/types";

export const RESPONSE_CONVERSION_MAP:Record<string,string>={
    '{s:sign}':'+'
};
export const COLOR_MAP:Record<ItemSlotType,Record<string,string>>={
'weapon':{
    primary:'#C47820',
    description:'#634222',
    highlight:'#432C16'
},
'spirit':{},
'vitality':{primary:'#7B912F',
    description:'#494D27',
    highlight:'#30391C'
}
}