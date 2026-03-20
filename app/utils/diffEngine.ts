// app/utils/diffEngine.ts

type DiffNode = {
  added: Record<string, any>;
  removed: Record<string, any>;
  modified: Record<string, any>;
  unmodified: Record<string, any>; // <-- New field to track unchanged data
};

// Helper to check if a value is a standard JSON object (and not an array or null)
const isObject = (val: any) => val !== null && typeof val === 'object' && !Array.isArray(val);

/**
 * Recursively compares two JSON objects and isolates the exact changes.
 */
export function calculateDeepDiff(oldJson: Record<string, any>, newJson: Record<string, any>): DiffNode {
  const diff: DiffNode = { added: {}, removed: {}, modified: {}, unmodified: {} };

  // 1. Find Added, Modified, and Unmodified fields
  for (const key in newJson) {
    if (!(key in oldJson)) {
      // The key doesn't exist in the old JSON, so it's brand new
      diff.added[key] = newJson[key];
    } else {
      // The key exists in both. We need to check if the values changed.
      const oldVal = oldJson[key];
      const newVal = newJson[key];

      // If both values are objects, we recursively dive deeper into them
      if (isObject(oldVal) && isObject(newVal)) {
        const nestedDiff = calculateDeepDiff(oldVal, newVal);
        
        // If anything changed inside this nested object, attach the whole nested diff
        if (
          Object.keys(nestedDiff.added).length > 0 ||
          Object.keys(nestedDiff.removed).length > 0 ||
          Object.keys(nestedDiff.modified).length > 0
        ) {
          diff.modified[key] = nestedDiff;
        } else {
          // If the nested object is perfectly identical, it goes here
          diff.unmodified[key] = newVal;
        }
      } 
      // If they are primitive values (or arrays) and they don't match exactly
      else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diff.modified[key] = { old: oldVal, new: newVal };
      } 
      // If primitive values match exactly
      else {
        diff.unmodified[key] = newVal;
      }
    }
  }

  // 2. Find Removed fields
  for (const key in oldJson) {
    if (!(key in newJson)) {
      diff.removed[key] = oldJson[key];
    }
  }

  return diff;
}

/**
 * Wrapper specifically for Deadlock API data to prevent Array Index shifting
 */
export function generateDeadlockPatchDiff(oldPatchArray: any[], newPatchArray: any[]) {
  // Using Object.fromEntries for O(n) performance and clean JSON serialization
  const oldMapped = Object.fromEntries(
    oldPatchArray.map(item => [item.name ?? item.class_name, item])
  );
  
  const newMapped = Object.fromEntries(
    newPatchArray.map(item => [item.name ?? item.class_name, item])
  );

  return calculateDeepDiff(oldMapped, newMapped);
}