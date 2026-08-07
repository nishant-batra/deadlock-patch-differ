// types.ts

import type { Change } from "#/utils/diffEngine";
import type { DisplayChange } from "#/utils/tooltipProjection";

export type { Change, DisplayChange };

export type ItemData = Item[];
export enum ItemSlotType {
	WEAPON = "weapon",
	SPIRIT = "spirit",
	VITALITY = "vitality",
}
export interface Item {
	id: number;
	class_name: string;
	name: string;
	start_trained: boolean;
	image?: string;
	image_webp?: string;
	shop_image?: string;
	shop_image_webp?: string;
	hero?: number;
	heroes: number[];
	update_time?: number;
	properties: Record<string, ItemProperty>;
	weapon_info: WeaponInfo;
	type: "weapon" | "ability" | "upgrade" | string;
	behaviours?: string[];
	description?: Description;
	upgrades?: Upgrade[];
	ability_type?: "signature" | "ultimate" | "innate" | string;
	boss_damage_scale?: number;
	item_slot_type: ItemSlotType;
	item_tier?: number;
	disabled?: boolean;
	activation?: "passive" | "instant_cast" | "press" | string;
	tooltip_sections?: TooltipSection[];
	is_active_item?: boolean;
	shopable?: boolean;
	cost?: number;
	tooltip_details?: TooltipDetails;
	videos?: Videos;
	component_items?: string[];
}

export interface ItemProperty {
	value: string | number;
	street_brawl_value?: string | number;
	can_set_token_override?: boolean;
	provided_property_type?: string;
	css_class?: string;
	disable_value?: string | number;
	display_units?: string;
	scale_function?: ScaleFunction;
	label?: string;
	postfix?: string;
	postvalue_label?: string;
	negative_attribute?: boolean;
	prefix?: string;
	icon?: string;
	usage_flags?: string[];
	conditional?: string;
	loc_token_override?: string;
	tooltip_section?: "innate" | "active" | "passive" | string;
	tooltip_is_elevated?: boolean;
	tooltip_is_important?: boolean;
}

export interface ScaleFunction {
	class_name?: string;
	subclass_name?: string;
	specific_stat_scale_type?: string;
	scaling_stats?: string[];
	stat_scale?: number;
	street_brawl_stat_scale?: number;
	upgrade_type?: string;
	scale_stat_filter?: string;
}
export interface ImportantPropertiesWithIcon {
	name: string;
	icon: string;
	localized_name: string;
}

export interface WeaponInfo {
	can_zoom?: boolean;
	bullet_damage?: number;
	bullet_gravity_scale?: number;
	bullet_inherit_shooter_velocity_scale?: number;
	bullet_lifetime?: number;
	bullet_radius?: number;
	bullet_reflect_amount?: number;
	bullet_reflect_scale?: number;
	bullet_whiz_distance?: number;
	burst_shot_cooldown?: number;
	crit_bonus_end?: number;
	crit_bonus_end_range?: number;
	crit_bonus_start?: number;
	crit_bonus_start_range?: number;
	cycle_time?: number;
	intra_burst_cycle_time?: number;
	damage_falloff_bias?: number;
	damage_falloff_end_range?: number;
	damage_falloff_end_scale?: number;
	damage_falloff_start_range?: number;
	damage_falloff_start_scale?: number;
	horizontal_punch?: number;
	range?: number;
	recoil_recovery_delay_factor?: number;
	bullet_speed?: number;
	recoil_recovery_speed?: number;
	recoil_shot_index_recovery_time_factor?: number;
	recoil_speed?: number;
	reload_move_speed?: number;
	scatter_yaw_scale?: number;
	aiming_shot_spread_penalty?: number[];
	standing_shot_spread_penalty?: number[];
	shoot_move_speed_percent?: number;
	shoot_spread_penalty_decay?: number;
	shoot_spread_penalty_decay_delay?: number;
	shoot_spread_penalty_per_shot?: number;
	shooting_up_spread_penalty?: number;
	vertical_punch?: number;
	zoom_move_speed_percent?: number;
	bullets?: number;
	burst_shot_count?: number;
	clip_size?: number;
	reload_duration?: number;
	horizontal_recoil?: HorizontalRecoil;
	shots_per_second?: number;
	shots_per_second_with_reload?: number;
	bullets_per_second?: number;
	bullets_per_second_with_reload?: number;
	damage_per_second?: number;
	damage_per_second_with_reload?: number;
	damage_per_shot?: number;
	damage_per_magazine?: number;
	reload_single_bullets?: boolean;
}

export interface HorizontalRecoil {
	range: number | number[];
	burst_exponent: number;
}

export interface Upgrade {
	property_upgrades: PropertyUpgrade[];
}

export interface PropertyUpgrade {
	name: string;
	bonus: string | number;
	scale_stat_filter?: string;
	upgrade_type?: string;
}

export interface Description {
	desc?: string;
	t1_desc?: string;
	t2_desc?: string;
	t3_desc?: string;
	active?: string;
	passive?: string;
}

export interface TooltipSection {
	section_type: string;
	section_attributes: SectionAttribute[];
}

export interface SectionAttribute {
	properties?: string[];
	elevated_properties?: string[];
	important_properties?: string[];
	important_properties_with_icon?: ImportantPropertiesWithIcon[];
	loc_string?: string;
}

export interface TooltipDetails {
	info_sections: InfoSection[];
}

export interface InfoSection {
	loc_string?: string;
	properties_block?: PropertiesBlock[];
	basic_properties?: string[];
}

export interface PropertiesBlock {
	properties: PropertyInfo[];
}

export interface PropertyInfo {
	important_property: string;
}

export interface Videos {
	webm?: string;
	mp4?: string;
}

// ---------------------------------------------------------------------------
// Heroes
// ---------------------------------------------------------------------------

export interface HeroImages {
	icon_hero_card?: string;
	icon_hero_card_webp?: string;
	icon_image_small?: string;
	icon_image_small_webp?: string;
	minimap_image?: string;
	minimap_image_webp?: string;
	top_bar_vertical_image?: string;
	top_bar_vertical_image_webp?: string;
	background_image?: string;
	background_image_webp?: string;
	/** No `_webp` sibling exists for this one. */
	name_image?: string;
}

export interface StartingStat {
	value: number;
	display_stat_name?: string;
}

export interface HeroColors {
	ui?: number[];
	style?: number[];
	style_hex?: string;
}

export interface Hero {
	id: number;
	class_name: string;
	name: string;
	images: HeroImages;
	/** `signature1` … `weapon_primary` → an item `class_name`. */
	items: Record<string, string>;
	starting_stats: Record<string, StartingStat>;
	standard_level_up_upgrades: Record<string, number>;
	colors?: HeroColors;
	player_selectable?: boolean;
	disabled?: boolean;
	in_development?: boolean;
}

// ---------------------------------------------------------------------------
// Patch artifacts
// ---------------------------------------------------------------------------

export interface PatchMeta {
	clientVersion: number;
	versionDatetime: string;
	ingestedAt: string;
	counts: { items: number; heroes: number };
}

export interface PatchNote {
	title: string;
	pubDate: string;
	link: string;
	source: string;
	/** Sanitized at ingest — safe for `dangerouslySetInnerHTML`. */
	html: string;
}

export interface PatchNotes {
	primary?: PatchNote;
	recent: PatchNote[];
}

export interface ItemsView {
	items: Item[];
	abilities: Item[];
}

export interface AbilityChange {
	ability: Item;
	changes: Change[];
}

export interface ChangedHero {
	hero: Hero;
	abilities: AbilityChange[];
	statChanges: Change[];
}

export interface ChangedItem {
	item: Item;
	changes: DisplayChange[];
}

/**
 * The three item groups, pre-grouped at ingest so the route renders them in
 * order without doing its own bucketing. Added and removed items carry no
 * change list - there is nothing to diff a new or deleted item against.
 */
export interface ItemChanges {
	added: Item[];
	removed: Item[];
	changed: ChangedItem[];
}
