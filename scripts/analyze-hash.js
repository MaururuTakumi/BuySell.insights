const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

function createRowHash(row, brand) {
  // Same logic as in the app
  const hashFields = [
    row.sale_date,
    brand.toUpperCase().trim(),
    (row.type || '').toLowerCase().trim(),
    (row.rank || '').toLowerCase().trim(),
    (row.model_number || '').toLowerCase().trim(),
    row.sale_quantity?.toString() || '1',
    row.adjusted_exp_sale_price?.toString() || '0',
    row.appraised_price?.toString() || '0',
    row.selling_price.toString(),
  ];

  const hashInput = hashFields.join('|');
  const hash = crypto.createHash('sha256').update(hashInput).digest('hex');

  return { hash, input: hashInput };
}

async function analyzeHashes() {
  // Get sample MONCLER records
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('brand', 'MONCLER')
    .eq('selling_price', 64800) // A specific price that might have duplicates
    .order('inserted_at', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} records with selling_price = 64800`);
  console.log('='.repeat(80));

  // Analyze each record's hash
  data.forEach((row, i) => {
    const { hash, input } = createRowHash(row, 'MONCLER');
    console.log(`\nRecord ${i + 1}:`);
    console.log(`DB Hash: ${row.row_hash}`);
    console.log(`Calculated Hash: ${hash}`);
    console.log(`Match: ${row.row_hash === hash ? '✓' : '✗'}`);
    console.log(`Hash Input: ${input}`);
    console.log(`Inserted: ${row.inserted_at}`);
  });

  // Check if there are records with same data but different hashes
  console.log('\n' + '='.repeat(80));
  console.log('Checking for same data with different hashes...');

  const dataMap = {};
  let sameDataDiffHash = 0;

  const { data: allData } = await supabase
    .from('sales')
    .select('*')
    .eq('brand', 'MONCLER');

  allData.forEach(row => {
    const key = `${row.sale_date}|${row.selling_price}|${row.type}|${row.rank}|${row.model_number}`;
    if (!dataMap[key]) {
      dataMap[key] = [];
    }
    dataMap[key].push(row.row_hash);
  });

  for (const [key, hashes] of Object.entries(dataMap)) {
    const uniqueHashes = [...new Set(hashes)];
    if (uniqueHashes.length > 1) {
      console.log(`Data: ${key}`);
      console.log(`  Has ${hashes.length} records with ${uniqueHashes.length} different hashes`);
      sameDataDiffHash++;
    }
  }

  console.log(`\nTotal: ${sameDataDiffHash} data combinations with different hashes`);
}

analyzeHashes().then(() => process.exit(0));