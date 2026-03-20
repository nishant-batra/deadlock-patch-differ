import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { getLatestPatchDiff } from '../server/patchService';
import Card from '#/components/card';
const closeQaurters=  {
    "id": 1342610602,
    "class_name": "upgrade_close_range",
    "name": "Close Quarters",
    "start_trained": true,
    "image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/upgrades/mods_weapon/close_range.png",
    "image_webp": "https://assets-bucket.deadlock-api.com/assets-api-res/images/upgrades/mods_weapon/close_range.webp",
    "heroes": [],
    "properties": {
      "AbilityCooldown": {
        "value": "0",
        "can_set_token_override": true,
        "css_class": "cooldown",
        "disable_value": "0",
        "scale_function": {
          "class_name": "scale_function_single_stat",
          "subclass_name": "AbilityCooldown_scale_function",
          "specific_stat_scale_type": "EItemCooldown"
        },
        "label": "Cooldown",
        "postfix": "s",
        "postvalue_label": "Cooldown",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/cooldown.svg"
      },
      "AbilityDuration": {
        "value": "0",
        "can_set_token_override": true,
        "css_class": "duration",
        "disable_value": "0",
        "scale_function": {
          "class_name": "scale_function_single_stat",
          "subclass_name": "AbilityDuration_scale_function",
          "specific_stat_scale_type": "ETechDuration"
        },
        "label": "Duration",
        "postfix": "s",
        "postvalue_label": "Duration",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/duration.svg"
      },
      "AbilityCastRange": {
        "value": "0",
        "can_set_token_override": true,
        "css_class": "range",
        "display_units": "EDisplayUnit_Meters",
        "scale_function": {
          "class_name": "scale_function_single_stat",
          "subclass_name": "AbilityCastRange_scale_function",
          "specific_stat_scale_type": "ETechRange"
        },
        "label": "Cast Range",
        "postfix": "m",
        "postvalue_label": "Cast Range",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/property_range.svg"
      },
      "AbilityUnitTargetLimit": {
        "value": "1",
        "can_set_token_override": true
      },
      "AbilityCastDelay": {
        "value": "0",
        "can_set_token_override": true,
        "css_class": "cast",
        "disable_value": "0",
        "label": "Cast Delay",
        "postfix": "s",
        "postvalue_label": "Cast Delay",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/images/upgrades/property_cast.png"
      },
      "AbilityChannelTime": {
        "value": "0",
        "can_set_token_override": true,
        "css_class": "cast",
        "disable_value": "0",
        "scale_function": {
          "class_name": "scale_function_multi_stats",
          "subclass_name": "scale_duration",
          "scaling_stats": [
            "EChannelDuration",
            "ETechDuration"
          ]
        },
        "label": "Channel Duration",
        "postfix": "s",
        "postvalue_label": "Channel Duration",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/images/upgrades/property_cast.png"
      },
      "AbilityPostCastDuration": {
        "value": "0",
        "disable_value": "0"
      },
      "AbilityCharges": {
        "value": "0",
        "can_set_token_override": true,
        "css_class": "cast",
        "disable_value": "-1",
        "scale_function": {
          "class_name": "scale_function_ability_charges",
          "subclass_name": "AbilityCharges_scale_function"
        },
        "label": "Charges",
        "postvalue_label": "Charges",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/images/upgrades/property_cast.png"
      },
      "AbilityCooldownBetweenCharge": {
        "value": "-1.0",
        "can_set_token_override": true,
        "css_class": "charge_cooldown",
        "disable_value": "-2",
        "scale_function": {
          "class_name": "scale_function_ability_recharge_time",
          "subclass_name": "scale_function_ability_recharge_time"
        },
        "label": "Charge Delay",
        "postfix": "s",
        "postvalue_label": "Charge Delay",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/recharge.svg"
      },
      "ChannelMoveSpeed": {
        "value": "-1",
        "can_set_token_override": true,
        "css_class": "move_speed",
        "display_units": "EDisplayUnit_MetersPerSecond",
        "postfix": "m",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/move_speed.svg"
      },
      "AbilityResourceCost": {
        "value": "0",
        "can_set_token_override": true,
        "css_class": "cast",
        "disable_value": "0",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/images/upgrades/property_cast.png"
      },
      "TechPower": {
        "value": "0",
        "can_set_token_override": true,
        "provided_property_type": "MODIFIER_VALUE_TECH_POWER",
        "disable_value": "0",
        "prefix": "{s:sign}",
        "label": "Spirit Power",
        "postfix": "",
        "postvalue_label": "Spirit Power"
      },
      "WeaponPower": {
        "value": "0",
        "can_set_token_override": true,
        "provided_property_type": "MODIFIER_VALUE_WEAPON_POWER",
        "disable_value": "0",
        "prefix": "{s:sign}",
        "label": "Weapon Damage",
        "postfix": "%",
        "postvalue_label": "Weapon Damage"
      },
      "CloseRangeBonusWeaponPower": {
        "value": "20",
        "provided_property_type": "MODIFIER_VALUE_CLOSE_RANGE_BONUS_BASE_DAMAGE_PERCENT",
        "css_class": "bullet_damage",
        "usage_flags": [
          "ConditionallyApplied"
        ],
        "display_units": "EDisplayUnit_Normal",
        "prefix": "{s:sign}",
        "label": "Weapon Damage",
        "postfix": "%",
        "postvalue_label": "Weapon Damage",
        "conditional": "within Range",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/damage_bullet_color.svg",
        "tooltip_section": "passive",
        "tooltip_is_elevated": false,
        "tooltip_is_important": true
      },
      "CloseRangeBonusDamageRange": {
        "value": "15m",
        "provided_property_type": "MODIFIER_VALUE_BONUS_WEAPON_DAMAGE_CLOSE_RANGE_MAX_RANGE",
        "css_class": "distance",
        "label": "Close Range",
        "postfix": "m",
        "postvalue_label": "Close Range",
        "icon": "https://assets-bucket.deadlock-api.com/assets-api-res/icons/range.svg",
        "tooltip_section": "passive",
        "tooltip_is_elevated": false,
        "tooltip_is_important": false
      },
      "MeleeResistPercent": {
        "value": "20",
        "provided_property_type": "MODIFIER_VALUE_MELEE_DAMAGE_REDUCTION_PERCENT",
        "prefix": "{s:sign}",
        "label": "Melee Resist",
        "postfix": "%",
        "postvalue_label": "Melee Resist",
        "tooltip_section": "innate",
        "tooltip_is_elevated": false,
        "tooltip_is_important": false
      }
    },
    "weapon_info": {},
    "type": "upgrade",
    "shop_image": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/close_quarters.png",
    "shop_image_webp": "https://assets-bucket.deadlock-api.com/assets-api-res/images/items/weapon/close_quarters.webp",
    "item_slot_type": "weapon",
    "item_tier": 1,
    "description": {
      "desc": "Deal additional <span class=\"highlight\">Weapon Damage</span> when in <span class=\"highlight\">close range</span> to your target."
    },
    "activation": "passive",
    "tooltip_sections": [
      {
        "section_type": "innate",
        "section_attributes": [
          {
            "properties": [
              "MeleeResistPercent"
            ]
          }
        ]
      },
      {
        "section_type": "passive",
        "section_attributes": [
          {
            "loc_string": "Deal additional <span class=\"highlight\">Weapon Damage</span> when in <span class=\"highlight\">close range</span> to your target.",
            "properties": [
              "CloseRangeBonusDamageRange"
            ],
            "important_properties": [
              "CloseRangeBonusWeaponPower"
            ]
          }
        ]
      }
    ],
    "upgrades": [
      {
        "property_upgrades": [
          {
            "name": "CloseRangeBonusWeaponPower",
            "bonus": "15"
          },
          {
            "name": "MeleeResistPercent",
            "bonus": "10"
          }
        ]
      }
    ],
    "is_active_item": false,
    "shopable": true,
    "cost": 800
  };

// 1. The Server Function (Executes on Vercel Edge)
const fetchLatestDiff = createServerFn({ method: 'GET' })
  .handler(async () => {
    // Cache this forever until the Vercel Deploy Hook rebuilds the site
    setResponseHeader('Cache-Control', 'public, s-maxage=31536000, immutable');
    return await getLatestPatchDiff();
  });

// 2. The Route Configuration
export const Route = createFileRoute('/')({
  loader: async () => fetchLatestDiff(),
  component: Home,
});

// 3. The React Component
function Home() {
  // const { oldVersion, newVersion, diff } = Route.useLoaderData();


  return (
<Card item={closeQaurters} />
  );
}