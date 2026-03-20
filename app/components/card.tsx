import type { Item } from "#/types";
import { RESPONSE_CONVERSION_MAP,COLOR_MAP } from "./constants";
import { replaceHighlight } from "#/utils/common-utils";
export default function Card({item}:{item:Item}) {
    const {name, item_slot_type, shop_image_webp,properties:allProperties,cost,activation,tooltip_sections}=item;

  return (
    <div className="flex flex-col"
    style={{
      background:COLOR_MAP[item_slot_type].description
    }}
    >
      <div className="flex flex-col"
      style={{background:COLOR_MAP[item_slot_type].primary}}>
        <p className="font-extrabold">{name}</p>
        <p className="font-medium text-green-200">{cost}</p>
        </div>
        <img src={shop_image_webp} width={80} height={80}/>

        {tooltip_sections?.map((stat)=>{
          const {section_type,section_attributes}=stat;
          return <div>
            {section_type!=='innate'&&<div style={{background:COLOR_MAP[item_slot_type].highlight}}>{section_type}</div>}
            {section_attributes?.map((property)=>{
              const {loc_string, properties,important_properties,elevated_properties}=property;
              const commonProps={allProperties,background:section_type!=='innate'?COLOR_MAP[item_slot_type].highlight:''}
              return <div>
                 {loc_string&&<div dangerouslySetInnerHTML={{__html:replaceHighlight(loc_string)}}/>}
                 <div className="flex gap-2">
                  {important_properties&&<RenderProperties itemProperties={important_properties} {...commonProps}/>}
                  {properties&&<RenderProperties itemProperties={properties} {...commonProps}/>}
                  {elevated_properties&&<RenderProperties  itemProperties={elevated_properties}  {...commonProps}/>}
                  </div>

              </div>
            })}
          
          </div>
        })}
    </div>)

}   

function RenderProperties({allProperties,itemProperties,background}:{allProperties:Item['properties'],itemProperties:Array<string>,background?:string}){
return <div style={{background}}>
  {itemProperties.map((property)=>{
    const displayProperty=allProperties[property];
    const {label,value,postfix,prefix,icon,tooltip_is_important,conditional}=displayProperty;
    const showPostfix=postfix&&value&&typeof value==="string" && value?.slice(value?.length-postfix?.length)!==postfix;
    return <div>
       {prefix&&RESPONSE_CONVERSION_MAP[prefix]}{value}{showPostfix&&postfix} {label} 
       {tooltip_is_important&&icon&&<img src={icon}/>}
       {conditional&&<p className="font-medium italic">Conditional</p>}
      </div>
  })}
</div>
}