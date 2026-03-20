import fs from 'fs';
import { generateDeadlockPatchDiff } from './app/utils/diffEngine'; // Adjust path if needed

function runTest() {
  // 1. Load your uploaded mock.json as the "Old" Patch
  const oldPatchArray = JSON.parse(fs.readFileSync('./app/mock.json', 'utf8'));

  // 2. Deep copy it to create our "New" Patch
  const newPatchArray = JSON.parse(JSON.stringify(oldPatchArray));

  // ==========================================
  // 🛠️ INTENTIONALLY MUTATE DATA FOR TESTING
  // ==========================================

  // TEST A: MODIFY an existing field
  // Let's change bullet_damage on the very first item (citadel_weapon_bosstier2_set)
  newPatchArray[0].weapon_info.bullet_damage = 999.9; 

  // TEST B: ADD a brand new field to an existing item
  newPatchArray[0].weapon_info.new_test_property = "This field was just added!";

  // TEST C: REMOVE an existing field
  // Let's delete the 'range' property from the first item
  delete newPatchArray[0].weapon_info.range;

  // TEST D: REMOVE an entire item
  // We will delete the second item in the array (citadel_weapon_bosstier3_set)
  newPatchArray.splice(1, 1);

  // TEST E: ADD a completely new item
  newPatchArray.push({
    id: 99999999,
    class_name: "new_overpowered_item",
    name: "new_overpowered_item",
    weapon_info: {
      bullet_damage: 5000
    }
  });

  // 3. Run the diff engine
  console.log('Running diff engine...');
  const diffResult = generateDeadlockPatchDiff(oldPatchArray, newPatchArray);

  // 4. Output the result
  console.log(JSON.stringify(diffResult, null, 2));
}

runTest();