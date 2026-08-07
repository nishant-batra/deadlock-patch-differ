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
import type { Item, TooltipSection } from "./app/types";

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

	console.log(
		failures === 0
			? "\nAll checks passed."
			: `\n${failures} check(s) FAILED.`,
	);
	if (failures > 0) process.exitCode = 1;
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
