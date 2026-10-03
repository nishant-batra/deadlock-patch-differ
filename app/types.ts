// types.ts

import type { TierDiff } from "#/lib/abilityUpgrades";
import type { Change } from "#/lib/diffEngine";
import type { DisplayChange } from "#/lib/tooltipProjection";

export type { Change, DisplayChange, TierDiff };

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

/** Only the upgrade-tier texts: the base description is each ability's first tooltip section. */
export interface Description {
	t1_desc?: string;
	t2_desc?: string;
	t3_desc?: string;
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
	hero_card_gloat?: string;
	hero_card_gloat_webp?: string;
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
	/** `"release"` for the live roster, `"pre_release"` for announced heroes. */
	development_state?: string;
	/** Three personality words, e.g. Rat King: Scrappy, Regal, Tenacious. */
	tags?: string[];
}

/** What `/heroes/$heroSlug` renders: a full live hero, or an announced one. */
export type HeroPage =
	| { kind: "live"; entry: HeroEntry }
	| { kind: "upcoming"; hero: Hero };

// ---------------------------------------------------------------------------
// Patch artifacts
// ---------------------------------------------------------------------------

export interface PatchMeta {
	clientVersion: number;
	versionDatetime: string;
	ingestedAt: string;
	/** `upcomingHeroes` is absent in metas ingested before it existed. */
	counts: { items: number; heroes: number; upcomingHeroes?: number };
	/** The patch the page shows, hotfixes included. Absent before windows existed. */
	window?: PatchWindow;
}

/** A patch and the hotfixes that followed it - see `app/lib/patchWindow.ts`. */
export interface PatchWindow {
	/** The build that opened the window: the patch itself. */
	startBuild: number;
	/** That build's `version_datetime`; the window runs 6 days from it. */
	startedAt: string;
	/** Every build merged into the page, `startBuild` first. */
	builds: number[];
}

export interface PatchNote {
	title: string;
	pubDate: string;
	link: string;
	source: string;
	/** Sanitized at ingest — safe for `dangerouslySetInnerHTML`. */
	html: string;
}

/** Attribution only - which update a set of diff cards came from. */
export interface NoteRef {
	title: string;
	pubDate: string;
	link: string;
}

export interface PatchNotes {
	/**
	 * The most recent note with content that is not item/hero changes, with
	 * those sections already stripped. May be a different (newer) update than
	 * `balance` - a rework like "Matchmaking Update" changes no items at all.
	 */
	general?: PatchNote;
	/** The update the item/hero diff came from, matched by date in its title. */
	balance?: NoteRef;
	recent: PatchNote[];
}

export interface ItemsView {
	items: Item[];
	abilities: Item[];
}

/** One slot type's worth of shop items, plus the catalog's total count for SEO copy. */
export interface ItemsPage {
	items: Array<{ item: Item; changes?: DisplayChange[] }>;
	totalCount: number;
}

export interface AbilityChange {
	ability: Item;
	changes: Change[];
	/**
	 * Per-tier upgrade diff. Always three entries, including for an unchanged
	 * ability - the popover renders the real upgrade content either way.
	 */
	tiers: TierDiff[];
}

/** A hero joined to its signature/ultimate abilities - no diff implied. */
export interface HeroEntry {
	hero: Hero;
	abilities: AbilityChange[];
}

/**
 * One hero's entry in hero-changes.json - already filtered to player-facing
 * values at ingest (see lib/heroChanges.ts). A hero is in that file if and only
 * if it changed.
 */
export interface HeroChanges {
	/** `starting_stats` / `standard_level_up_upgrades` moves. */
	stats: Change[];
	/** `weapon_info` moves. */
	weapon: Change[];
	/** Ability name -> its property/scaling/description moves. */
	abilities: Record<string, Change[]>;
	/** Released this patch - no playable baseline to diff, so no changes. */
	isNew?: true;
}

export interface ChangedHero extends HeroEntry {
	statChanges: Change[];
	/** Changes to the hero's weapon (`weapon_info.*`) - not an ability. */
	weaponChanges: Change[];
	isNew?: true;
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
