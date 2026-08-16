import fs from "node:fs";
import {
	type Change,
	generateDeadlockPatchDiff,
	hasAnyChange,
	pruneUnmodified,
	summarize,
} from "./app/utils/diffEngine";
import { hasProse, sanitizeNotesHtml } from "./app/utils/sanitizeHtml";
import { diffItems } from "./app/utils/tooltipProjection";
import { diffWords } from "./app/utils/wordDiff";
import {
	generalHtml,
	hasGeneralContent,
	splitSections,
	titleDate,
} from "./app/utils/noteSections";
import {
	diffAbilityTiers,
	hasTierChanges,
} from "./app/utils/abilityUpgrades";
import { isLiveHero } from "./app/utils/roster";
import type { Hero, Item, TooltipSection } from "./app/types";

let failures = 0;
function assert(label: string, condition: boolean, detail?: unknown) {
	if (condition) {
		console.log(`  PASS  ${label}`);
	} else {
		failures += 1;
		console.error(`  FAIL  ${label}`, detail ?? "");
	}
}

function runTest() {
	// 1. Load mock.json as the "old" patch, deep-copy it as the "new" patch.
	const oldPatchArray = JSON.parse(fs.readFileSync("./app/mock.json", "utf8"));
	const newPatchArray = JSON.parse(JSON.stringify(oldPatchArray));

	// TEST A: MODIFY an existing nested field
	newPatchArray[0].weapon_info.bullet_damage = 999.9;
	// TEST B: ADD a brand new nested field
	newPatchArray[0].weapon_info.new_test_property = "This field was just added!";
	// TEST C: REMOVE an existing nested field
	delete newPatchArray[0].weapon_info.range;
	// TEST D: REMOVE an entire item
	const removedItem = newPatchArray[1];
	newPatchArray.splice(1, 1);
	// TEST E: ADD a completely new item
	newPatchArray.push({
		id: 99999999,
		class_name: "new_overpowered_item",
		name: "new_overpowered_item",
		weapon_info: { bullet_damage: 5000 },
	});

	console.log("Running diff engine...");
	const rawDiff = generateDeadlockPatchDiff(oldPatchArray, newPatchArray);
	const pruned = pruneUnmodified(rawDiff);

	const firstName = oldPatchArray[0].name ?? oldPatchArray[0].class_name;
	const removedName = removedItem.name ?? removedItem.class_name;

	console.log("\npruneUnmodified:");
	assert("reports changes", hasAnyChange(pruned));
	assert(
		"drops `unmodified` at every level",
		!JSON.stringify(pruned).includes('"unmodified"'),
	);
	assert(
		"is far smaller than the raw diff",
		JSON.stringify(pruned).length < JSON.stringify(rawDiff).length / 5,
		`${JSON.stringify(pruned).length} vs ${JSON.stringify(rawDiff).length}`,
	);
	assert("keeps the added item", "new_overpowered_item" in pruned.added);
	assert("keeps the removed item", removedName in pruned.removed);
	assert("keeps the modified item", firstName in pruned.modified);
	assert(
		"drops items with no changes",
		Object.keys(pruned.modified).length === 1,
		Object.keys(pruned.modified),
	);

	console.log("\nsummarize: all five mutation types survive flattening");
	const topLevel = summarize(pruned);
	const find = (path: string, kind: Change["kind"]) =>
		topLevel.find((c) => c.path.join(".") === path && c.kind === kind);

	assert("E: added item", Boolean(find("new_overpowered_item", "added")));
	assert("D: removed item", Boolean(find(removedName, "removed")));

	const modified = find(
		`${firstName}.weapon_info.bullet_damage`,
		"modified",
	);
	assert("A: modified nested field is present", Boolean(modified));
	assert("A: carries old and new", modified?.new === 999.9, modified);

	const added = find(`${firstName}.weapon_info.new_test_property`, "added");
	assert("B: added nested field", Boolean(added));
	assert(
		"B: carries the new value",
		added?.new === "This field was just added!",
		added,
	);

	const removed = find(`${firstName}.weapon_info.range`, "removed");
	assert("C: removed nested field", Boolean(removed));
	assert("C: carries the old value", removed?.old !== undefined, removed);

	assert(
		"summarize() on a missing node is empty, not a crash",
		summarize(undefined).length === 0,
	);

	console.log("\nsanitizeNotesHtml:");
	const dirty =
		'<div class="bbWrapper"><script>alert(1)</script>' +
		'<p class="bb_paragraph" onclick="steal()">- Buffed <b>Urn</b></p>' +
		'<a href="javascript:alert(1)">bad</a>' +
		'<a href="https://example.com" class="x">good</a>' +
		"<marquee>unknown tag text</marquee></div>";
	const clean = sanitizeNotesHtml(dirty);
	assert("strips <script>", !clean.includes("alert(1)</script"));
	assert("strips class attributes", !clean.includes("class="));
	assert("strips on* handlers", !/ on[a-z]+=/i.test(clean));
	assert("strips javascript: hrefs", !clean.includes("javascript:"));
	assert("keeps safe hrefs", clean.includes('href="https://example.com"'));
	assert("keeps allowed tags", clean.includes("<b>Urn</b>"));
	assert(
		"unwraps unknown tags but keeps their text",
		clean.includes("unknown tag text") && !clean.includes("<marquee"),
	);
	assert("unwraps <div>", !clean.includes("<div"));

	assert("hasProse rejects an empty string", !hasProse(""));
	assert("hasProse rejects markup with no text", !hasProse("<p></p><br/>"));
	assert(
		"hasProse accepts real prose",
		hasProse("<p>- Urn Runner sprint bonus reduced from +2m to 0 metres</p>"),
	);

	testTooltipProjection();
	testWordDiff();
	testNoteSections();
	testAbilityTiers();
	testRoster();

	console.log(
		failures === 0
			? "\nAll checks passed."
			: `\n${failures} check(s) FAILED.`,
	);
	if (failures > 0) process.exitCode = 1;
}

/** The live-roster filter, checked against the real catalog. */
function testRoster() {
	const heroes: Hero[] = JSON.parse(
		fs.readFileSync("./app/data/heroes-view.json", "utf8"),
	);
	const live = heroes.filter(isLiveHero);

	console.log("\nroster: only heroes actually in play");
	assert("keeps 38 of 57", live.length === 38, live.length);
	const name = (n: string) => live.some((h) => h.name === n);
	assert("excludes Raven (experimental)", !name("Raven"));
	assert("excludes Fathom (unreleased)", !name("Fathom"));
	assert("excludes Boho (Hero Labs)", !name("Boho"));
	assert("keeps Infernus", name("Infernus"));
	assert("keeps The Doorman", name("The Doorman"));
	assert(
		"every kept hero is selectable and not disabled",
		live.every((h) => h.player_selectable && !h.disabled && !h.in_development),
	);
}

/**
 * Per-tier ability upgrade diffing. The fixture is the real Powder Keg T3
 * change, which is the case that breaks a naive implementation: it repeats
 * `ImpactDamage` and `DPS` within one tier, once flat and once spirit-scaling.
 */
function testAbilityTiers() {
	const tier = (...ups: Array<Record<string, unknown>>) => ({
		property_upgrades: ups,
	});
	const before = {
		description: { t3_desc: "Deals bonus damage." },
		upgrades: [
			tier({ name: "AbilityCooldown", bonus: "-10" }),
			tier({ name: "AbilityCharges", bonus: "1" }),
			tier(
				{ name: "BarrelDamage", bonus: "80" },
				{ name: "AbilityCooldownBetweenCharge", bonus: "-5" },
				{
					name: "BarrelDamage",
					bonus: 0.5,
					scale_stat_filter: "ETechPower",
					upgrade_type: "EAddToScale",
				},
			),
		],
	} as unknown as Item;
	const after = {
		description: { t3_desc: "Deals bonus impact damage." },
		upgrades: [
			tier({ name: "AbilityCooldown", bonus: "-10" }),
			tier({ name: "AbilityCharges", bonus: "1" }),
			tier(
				{ name: "ImpactDamage", bonus: "40" },
				{ name: "DPS", bonus: "13.3333" },
				{ name: "AbilityCooldownBetweenCharge", bonus: "-5" },
				{
					name: "ImpactDamage",
					bonus: 0.25,
					scale_stat_filter: "ETechPower",
					upgrade_type: "EAddToScale",
				},
				{
					name: "DPS",
					bonus: 0.083333,
					scale_stat_filter: "ETechPower",
					upgrade_type: "EAddToScale",
				},
			),
		],
	} as unknown as Item;

	const tiers = diffAbilityTiers(before, after);
	console.log("\nabilityUpgrades: Powder Keg T3 (the real regression case)");
	assert("always three tiers", tiers.length === 3);
	assert(
		"T1 and T2 are untouched",
		tiers[0].rows.every((r) => r.kind === "equal") &&
			tiers[1].rows.every((r) => r.kind === "equal"),
	);

	const t3 = tiers[2];
	const kinds = (label: string) =>
		t3.rows.filter((r) => r.label === label).map((r) => r.kind);
	assert("BarrelDamage removed", kinds("Barrel Damage").includes("removed"));
	assert("ImpactDamage added", kinds("Impact Damage").includes("added"));
	assert("DPS added", kinds("DPS").includes("added"));
	assert(
		"AbilityCooldownBetweenCharge unchanged",
		kinds("Ability Cooldown Between Charge").join() === "equal",
		kinds("Ability Cooldown Between Charge"),
	);
	// The whole point of the composite key: the flat and scaling entries of the
	// same property must not collapse into one row.
	assert(
		"duplicate names stay as separate rows",
		t3.rows.filter((r) => r.label === "Impact Damage").length === 2 &&
			t3.rows.filter((r) => r.label === "DPS").length === 2,
		t3.rows.map((r) => `${r.label}:${r.kind}`),
	);
	assert(
		"the scaling row is marked",
		t3.rows.some((r) => r.label === "Impact Damage" && r.scaling === "ETechPower"),
	);
	assert("DPS keeps its acronym casing", kinds("DPS").length === 2, t3.rows.map((r) => r.label));

	console.log("\nabilityUpgrades: tier descriptions and edge cases");
	assert("t3_desc rewrite surfaces on tier 3", Boolean(t3.text), t3.text);
	assert("tier 1 has no text change", !tiers[0].text);
	assert(
		"the text diff carries both sides",
		t3.text?.old === "Deals bonus damage." &&
			t3.text?.new === "Deals bonus impact damage.",
		t3.text,
	);

	const self = diffAbilityTiers(after, after);
	assert(
		"an unchanged ability is all `equal` (so it still renders)",
		self.every((t) => t.rows.every((r) => r.kind === "equal") && !t.text),
	);
	assert(
		"hasTierChanges is false for a self-diff",
		!hasTierChanges(self) && hasTierChanges(tiers),
	);

	// Test Wraith Card Trick regression: adding scale_stat_filter to an existing upgrade
	// should not split into an added + removed pair
	const wraithBefore = {
		upgrades: [
			{
				property_upgrades: [
					{ name: "HeartHeal", bonus: "75" },
					{ name: "HeartHeal", bonus: "0.5", upgrade_type: "EAddToScale" },
				],
			},
		],
	} as unknown as Item;
	const wraithAfter = {
		upgrades: [
			{
				property_upgrades: [
					{ name: "HeartHeal", bonus: "75" },
					{
						name: "HeartHeal",
						bonus: "0.5",
						upgrade_type: "EAddToScale",
						scale_stat_filter: "ETechPower",
					},
				],
			},
		],
	} as unknown as Item;
	const wraithDiff = diffAbilityTiers(wraithBefore, wraithAfter);
	const wraithT1Rows = wraithDiff[0].rows;
	assert(
		"adding scaling to an existing upgrade does not duplicate into added+removed",
		wraithT1Rows.length === 2 &&
			!wraithT1Rows.some((r) => r.kind === "removed") &&
			!wraithT1Rows.some((r) => r.kind === "added"),
		wraithT1Rows.map((r) => `${r.label}:${r.kind}`),
	);

	const empty = diffAbilityTiers({} as Item, {} as Item);
	assert(
		"an ability with no upgrades yields three empty tiers, not a crash",
		empty.length === 3 && empty.every((t) => t.rows.length === 0),
	);
	assert(
		"undefined inputs do not crash",
		diffAbilityTiers(undefined, undefined).length === 3,
	);
}

/**
 * Patch-note section splitting. Fixtures are the two real markup shapes in the
 * live feed: headed notes using `<b>\[ Items ]</b>`, and unheaded ones that are
 * a single <p> with <br> separators.
 */
function testNoteSections() {
	const P = (s: string) => `<p class="bb_paragraph">${s}</p>`;
	const HEAD = (name: string) => P(`<b>\\[ ${name} ]</b>`);
	const known = new Set(["Apollo", "Shiv", "Crushing Fists", "Cursed Relic"]);

	console.log("\nnoteSections: titleDate joins a note to its build");
	assert(
		'" Minor Update - 08-12-2026" -> 2026-08-12',
		titleDate(" Minor Update - 08-12-2026") === "2026-08-12",
		titleDate(" Minor Update - 08-12-2026"),
	);
	assert(
		'"Matchmaking Update" has no date',
		titleDate("Matchmaking Update") === null,
	);

	console.log("\nnoteSections: headed note drops Items and Heroes");
	// The 07-28 shape.
	const headed =
		HEAD("General") +
		P("- Stamina bucket 3 heroes have their ground dash time increased") +
		HEAD("Items") +
		P("- Crushing Fists: Max stacks stun duration increased from 0.5s to 0.75s") +
		P("- Cursed Relic: No longer has -14% Damage Output innate") +
		HEAD("Heroes") +
		P("- Apollo: Riposte melee resist reduction increased");

	const names = splitSections(headed)
		.map((s) => s.name)
		.filter(Boolean);
	assert(
		"finds all three sections",
		JSON.stringify(names) === JSON.stringify(["General", "Items", "Heroes"]),
		names,
	);

	const generalOnly = generalHtml(headed, known);
	assert("keeps the General text", generalOnly.includes("Stamina bucket"));
	assert("drops the Items section", !generalOnly.includes("Crushing Fists"));
	assert("drops Cursed Relic too", !generalOnly.includes("Cursed Relic"));
	assert("drops the Heroes section", !generalOnly.includes("Apollo"));

	console.log("\nnoteSections: a new heading is kept, not silently dropped");
	// Only 5 headings exist today; an unseen one must default to General.
	const withNew =
		HEAD("Map Changes") + P("- Mid lane reworked") + HEAD("Items") + P("- x");
	const keptNew = generalHtml(withNew, known);
	assert("keeps Map Changes", keptNew.includes("Mid lane reworked"));
	assert("still drops Items", !keptNew.includes("- x"));

	console.log("\nnoteSections: unheaded note filters balance lines per line");
	// The 08-12 shape: ONE <p>, <br>-separated, all hero balance.
	const unheaded = P(
		[
			"- Apollo: Riposte melee resist reduction increased from -22% to -25%",
			"- Shiv: Alt Fire ammo cost reduced from 5 to 4",
		].join("<br>"),
	);
	const unheadedGeneral = generalHtml(unheaded, known);
	assert(
		"a pure balance note yields no general content",
		!hasGeneralContent(unheaded, known),
		unheadedGeneral,
	);
	assert("does not leak Apollo", !unheadedGeneral.includes("Apollo"));

	console.log("\nnoteSections: unheaded note keeps genuine general lines");
	// The 07-09 shape: Urn lines are general, hero lines are balance.
	const mixed = P(
		[
			"- Urn Runner sprint bonus reduced from +2m to 0",
			"- Apollo: Riposte melee resist reduction increased",
			"- Urn talking frequency increased from every 8s to every 6s",
		].join("<br>"),
	);
	const mixedGeneral = generalHtml(mixed, known);
	assert("keeps the Urn lines", mixedGeneral.includes("Urn Runner sprint"));
	assert("keeps the second Urn line", mixedGeneral.includes("talking frequency"));
	assert("drops the hero line", !mixedGeneral.includes("Apollo"));
	assert("reports general content", hasGeneralContent(mixed, known));

	console.log("\nnoteSections: a rework note is kept whole");
	const rework = P("This update includes a revamp to how matchmaking works, with Ranked mode.");
	assert(
		"keeps rework prose",
		generalHtml(rework, known).includes("Ranked"),
		generalHtml(rework, known),
	);
}

/**
 * Word-level description diff. Cases are the real prose-rewrite shapes from the
 * 6640->6644 patch.
 */
function testWordDiff() {
	const text = (ops: ReturnType<typeof diffWords>, ...keep: string[]) =>
		ops
			.filter((o) => keep.includes(o.op))
			.map((o) => o.text)
			.join("");

	console.log("\nwordDiff: reconstruction invariants");
	// The safety net: whatever the alignment does, the surviving text must
	// rebuild each side exactly. This catches any tokenizer or backtrack bug.
	const pairs: Array<[string, string]> = [
		[
			"Reset the cooldown of the imbued non-ultimate ability.",
			"Reset the cooldown of the imbued non-ultimate ability.This item's cooldown is increased by the cooldown of the imbued ability.",
		],
		[
			"Grants Fire Rate and Spirit Resistance but Silences you and disables stamina usage and regeneration.",
			"Grants Fire Rate, Spirit Resistance and Move Speed, and removes the Move Speed penalty while shooting, but Silences you and disables stamina usage and regeneration.",
		],
		["", "brand new text"],
		["gone entirely", ""],
	];
	for (const [before, after] of pairs) {
		const ops = diffWords(before, after);
		assert(
			`equal+delete rebuilds "before" (${before.slice(0, 20)}…)`,
			text(ops, "equal", "delete") === before,
			text(ops, "equal", "delete"),
		);
		assert(
			`equal+insert rebuilds "after" (${after.slice(0, 20)}…)`,
			text(ops, "equal", "insert") === after,
			text(ops, "equal", "insert"),
		);
	}

	console.log("\nwordDiff: pure append (Echo Shard shape)");
	const append = diffWords(
		"Reset the cooldown of the imbued non-ultimate ability.",
		"Reset the cooldown of the imbued non-ultimate ability.This item's cooldown is increased by the cooldown of the imbued ability.",
	);
	assert("no deletions on a pure append", !append.some((o) => o.op === "delete"));
	assert("exactly one inserted run", append.filter((o) => o.op === "insert").length === 1);
	assert(
		"the inserted run is the appended clause",
		text(append, "insert").startsWith("This item's cooldown"),
		text(append, "insert"),
	);

	console.log("\nwordDiff: substitution keeps the shared tail (Fury Trance shape)");
	const sub = diffWords(
		"Grants Fire Rate and Spirit Resistance but Silences you and disables stamina usage and regeneration.",
		"Grants Fire Rate, Spirit Resistance and Move Speed, and removes the Move Speed penalty while shooting, but Silences you and disables stamina usage and regeneration.",
	);
	assert("has deletions", sub.some((o) => o.op === "delete"));
	assert("has insertions", sub.some((o) => o.op === "insert"));
	assert(
		"the retained tail stays equal",
		text(sub, "equal").includes("but Silences you and disables stamina usage and regeneration."),
		text(sub, "equal"),
	);

	console.log("\nwordDiff: a comma insertion does not restrike its neighbour");
	// The load-bearing tokenizer case: "Resist and" -> "Resist, Debuff Resist and"
	// must NOT mark the first "Resist" as deleted just because a comma arrived.
	const comma = diffWords("Apply Resist and an aura", "Apply Resist, Debuff Resist and an aura");
	assert(
		'"Resist" is not deleted',
		!comma.some((o) => o.op === "delete" && o.text.includes("Resist")),
		comma,
	);
	assert(
		"the comma and Debuff Resist are inserted",
		text(comma, "insert").includes(",") && text(comma, "insert").includes("Debuff Resist"),
		text(comma, "insert"),
	);
	assert(
		"identical text yields no changes",
		diffWords("same text", "same text").every((o) => o.op === "equal"),
	);
}

/**
 * The committed baseline is the current build, so a live ingest legitimately
 * reports zero changes and cannot exercise any of this. These run against a
 * synthetic baseline instead: take the real payload, mutate it in precisely
 * known ways, and assert that only the player-visible mutations surface.
 */
function testTooltipProjection() {
	const all: Item[] = JSON.parse(
		fs.readFileSync("./app/data/latest-patch.json", "utf8"),
	);
	const shop = all.filter(
		(i) =>
			!Object.hasOwn(i, "hero") &&
			i.item_slot_type &&
			i.shopable &&
			i.item_tier &&
			i.item_tier < 5,
	);

	console.log("\ntooltipProjection: self-diff");
	const selfDiffs = shop.filter((i) => diffItems(i, i).length > 0);
	assert(
		`no item diffs against itself (${shop.length} items)`,
		selfDiffs.length === 0,
		selfDiffs.map((i) => i.name),
	);

	// Keys the tooltip lists, versus keys that exist but are never rendered.
	const displayedKeys = (item: Item) => {
		const keys = new Set<string>();
		for (const section of item.tooltip_sections ?? []) {
			for (const attribute of section.section_attributes ?? []) {
				for (const bucket of [
					attribute.important_properties,
					attribute.elevated_properties,
					attribute.properties,
				]) {
					for (const key of bucket ?? []) keys.add(key);
				}
			}
		}
		return [...keys].filter((k) => k !== "AbilityCooldown" && item.properties?.[k]);
	};
	const hiddenKeys = (item: Item) => {
		const shown = new Set(displayedKeys(item));
		return Object.keys(item.properties ?? {}).filter((k) => !shown.has(k));
	};

	const withLoc = (item: Item) =>
		(item.tooltip_sections ?? []).some((s) =>
			(s.section_attributes ?? []).some((a) => a.loc_string),
		);
	const firstLoc = (item: Item) => {
		for (const section of item.tooltip_sections ?? []) {
			for (const attribute of section.section_attributes ?? []) {
				if (attribute.loc_string) return attribute;
			}
		}
		return undefined;
	};

	// Eight items, eight distinct mutations. Only two are visible in game.
	const pool = shop.filter(
		(i) => displayedKeys(i).length > 0 && hiddenKeys(i).length > 0 && withLoc(i),
	);
	assert("found enough mutable items", pool.length >= 8, pool.length);
	if (pool.length < 8) return;

	const before = pool.slice(0, 8);
	const after: Item[] = JSON.parse(JSON.stringify(before));

	// VISIBLE 1 - a rendered stat value moves.
	const visibleKey = displayedKeys(after[0]);
	after[0].properties[visibleKey[0]].value = "999";
	// INVISIBLE 1 - a value on a property the tooltip never lists.
	after[1].properties[hiddenKeys(after[1])[0]].value = "999";
	// INVISIBLE 2 - internal modifier enum.
	after[2].properties[displayedKeys(after[2])[0]].provided_property_type =
		"MODIFIER_VALUE_SOMETHING_ELSE";
	// INVISIBLE 3 - upgrade-path delta, not the item's own stat.
	after[3].upgrades = [{ property_upgrades: [{ name: "Whatever", bonus: "77" }] }];
	// VISIBLE 2 - a number written into the prose.
	firstLoc(before[4])!.loc_string = "Consume it for 150% Bonus Souls.";
	firstLoc(after[4])!.loc_string = "Consume it for 180% Bonus Souls.";
	// INVISIBLE 4 - same prose, different inline SVG attributes.
	firstLoc(before[5])!.loc_string = 'Deals <svg width="128"><path d="a"/></svg> damage.';
	firstLoc(after[5])!.loc_string = 'Deals <svg width="15"><path d="a"/></svg> damage.';
	// INVISIBLE 5 - casing only.
	firstLoc(before[6])!.loc_string = "Deals bonus Spirit Damage.";
	firstLoc(after[6])!.loc_string = "Deals bonus spirit damage.";
	// INVISIBLE 6 - tier is reflected in the price, never in the tooltip.
	after[7].item_tier = (after[7].item_tier ?? 1) + 1;

	console.log("\ntooltipProjection: only visible mutations surface");
	const surfaced = before
		.map((item, index) => ({ item, changes: diffItems(item, after[index]) }))
		.filter((entry) => entry.changes.length > 0);

	assert(
		"exactly 2 of 8 mutated items surface",
		surfaced.length === 2,
		surfaced.map((s) => `${s.item.name}: ${JSON.stringify(s.changes)}`),
	);
	assert(
		"the moved stat surfaces as a `stat` change",
		surfaced[0]?.changes[0]?.kind === "stat" &&
			surfaced[0]?.changes[0]?.new === "999",
		surfaced[0]?.changes,
	);
	assert(
		"the prose rewrite surfaces as a `text` change",
		surfaced[1]?.changes[0]?.kind === "text",
		surfaced[1]?.changes,
	);
	// Only the emitted changes - the source items obviously still contain these
	// fields, the point is that none of them reach a change row.
	const emitted = JSON.stringify(surfaced.map((s) => s.changes));
	assert(
		"no change mentions an invisible field",
		!/provided_property_type|scale_function|css_class|tooltip_is_|street_brawl|upgrades|item_tier/.test(
			emitted,
		),
		emitted.slice(0, 300),
	);

	console.log("\ntooltipProjection: rows appearing and disappearing");
	const [rowBefore] = JSON.parse(JSON.stringify([pool[0]])) as Item[];
	const [rowAfter] = JSON.parse(JSON.stringify([pool[0]])) as Item[];
	const dropped = displayedKeys(rowAfter)[0];
	for (const section of rowAfter.tooltip_sections ?? []) {
		for (const attribute of section.section_attributes ?? []) {
			attribute.properties = attribute.properties?.filter((k) => k !== dropped);
			attribute.elevated_properties = attribute.elevated_properties?.filter(
				(k) => k !== dropped,
			);
			attribute.important_properties = attribute.important_properties?.filter(
				(k) => k !== dropped,
			);
		}
	}
	const rowChanges = diffItems(rowBefore, rowAfter);
	assert(
		"a row leaving the tooltip reports as row-removed",
		rowChanges.some((c) => c.kind === "row-removed" && c.key === dropped),
		rowChanges,
	);
	assert(
		"the reverse reports as row-added",
		diffItems(rowAfter, rowBefore).some(
			(c) => c.kind === "row-added" && c.key === dropped,
		),
	);

	console.log("\ntooltipProjection: repeated section types");
	// 4 shop items carry two sections of the same type and 16 carry an untyped
	// one. Matching sections by type alone finds only the first, silently losing
	// every change in the second.
	const keysOfSection = (item: Item, section: TooltipSection | undefined) =>
		(section?.section_attributes ?? [])
			.flatMap((a) => [
				...(a.important_properties ?? []),
				...(a.elevated_properties ?? []),
				...(a.properties ?? []),
			])
			.filter((k) => k !== "AbilityCooldown" && item.properties?.[k]);

	// The item must not only repeat a section type - its LAST section has to
	// carry a mutable key, or the test would pass without asserting anything.
	const repeated = shop.find((item) => {
		const sections = item.tooltip_sections ?? [];
		const types = sections.map((s) => s.section_type);
		if (new Set(types).size === types.length) return false;
		const last = sections.at(-1);
		const firstOfType = sections.find((s) => s.section_type === last?.section_type);
		return last !== firstOfType && keysOfSection(item, last).length > 0;
	});
	assert(
		"found a repeated-section item with a mutable last section",
		Boolean(repeated),
		repeated?.name,
	);
	if (repeated) {
		const [repBefore] = JSON.parse(JSON.stringify([repeated])) as Item[];
		const [repAfter] = JSON.parse(JSON.stringify([repeated])) as Item[];
		const last = (repAfter.tooltip_sections ?? []).at(-1);
		const target = keysOfSection(repAfter, last)[0];
		repAfter.properties[target].value = "4242";
		const found = diffItems(repBefore, repAfter);
		assert(
			"a change in a repeated section is not swallowed",
			found.some((c) => c.kind === "stat" && c.key === target),
			{ item: repeated.name, section: last?.section_type, target, found },
		);
	}

	console.log("\ntooltipProjection: cost and components");
	const [costBefore] = JSON.parse(JSON.stringify([pool[0]])) as Item[];
	const [costAfter] = JSON.parse(JSON.stringify([pool[0]])) as Item[];
	costAfter.cost = (costAfter.cost ?? 0) + 500;
	assert(
		"a cost move reports as `cost`",
		diffItems(costBefore, costAfter).some((c) => c.kind === "cost"),
	);
	const [compAfter] = JSON.parse(JSON.stringify([pool[0]])) as Item[];
	compAfter.component_items = [...(compAfter.component_items ?? []), "new_part"];
	assert(
		"a component move reports as `components`",
		diffItems(costBefore, compAfter).some((c) => c.kind === "components"),
	);
	const [reordered] = JSON.parse(JSON.stringify([pool[0]])) as Item[];
	reordered.component_items = [...(reordered.component_items ?? [])].reverse();
	assert(
		"reordering components alone is not a change",
		!diffItems(costBefore, reordered).some((c) => c.kind === "components"),
	);
}

runTest();
