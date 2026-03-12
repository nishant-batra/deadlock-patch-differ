import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import crypto from 'crypto'; // Built-in Node module
import stringify from 'fast-json-stable-stringify';

// Load the .env file
dotenv.config();

const uri = process.env.MONGODB_URI;

async function ingestCurrentPatch() {
  if (!uri) {
    throw new Error('MONGODB_URI is missing from your .env file.');
  }

  const client = new MongoClient(uri);

  try {
    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    
    const db = client.db('deadlock_db');
    const patchesCollection = db.collection('patches');

    console.log('Fetching live item data from Deadlock API...');
    const response = await fetch('https://assets.deadlock-api.com/v2/items');
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const itemsData = await response.json();

    // 1. Generate a SHA-256 hash of the incoming API data
    const newDataHash = crypto
      .createHash('sha256')
      .update(stringify(itemsData))
      .digest('hex');

    // 2. Fetch the most recent patch from the database
    const latestPatch = await patchesCollection.findOne(
      {}, 
      { sort: { ingestedAt: -1 }, // Sort descending to get the newest entry
      projection: { dataHash: 1 } // Only fetch the dataHash field
      }
    );

    // 3. Compare the hashes
    if (latestPatch && latestPatch.dataHash === newDataHash) {
      console.log('No item changes detected since the last ingestion. Exiting.');
      return;
    }

    // 4. If hashes are different (or if it's the first run), save the new data
    // We add a short timestamp to the ID just in case there are two hotfixes in one day
    const today = new Date().toISOString().split('T')[0];
    const timeSuffix = Date.now().toString().slice(-4);
    const patchId = `patch-${today}-${timeSuffix}`;

    const patchDocument = {
      patchId: patchId,
      ingestedAt: new Date(),
      dataHash: newDataHash, // Save the hash for future comparisons
      data: itemsData,
    };

    console.log('Changes detected! Saving new patch data to MongoDB...');
    const result = await patchesCollection.insertOne(patchDocument);
    
    console.log(`✅ Successfully saved current patch data! Document ID: ${result.insertedId}`);

  } catch (error) {
    console.error('❌ Error during ingestion:', error);
  } finally {
    await client.close();
    console.log('Database connection closed.');
  }
}

ingestCurrentPatch();