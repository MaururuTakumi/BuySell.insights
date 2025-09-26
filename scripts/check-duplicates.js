const { createClient } = require('@supabase/supabase-js');
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

async function checkDuplicates() {
  // Get all MONCLER records
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('brand', 'MONCLER')
    .order('inserted_at', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total MONCLER records in database: ${data.length}`);
  console.log('='.repeat(80));

  // Check for duplicate row_hash
  const hashMap = {};
  const duplicates = [];

  data.forEach(row => {
    if (hashMap[row.row_hash]) {
      duplicates.push({
        hash: row.row_hash,
        original: hashMap[row.row_hash],
        duplicate: row
      });
    } else {
      hashMap[row.row_hash] = row;
    }
  });

  if (duplicates.length > 0) {
    console.log(`Found ${duplicates.length} duplicate row_hash values!`);
    duplicates.slice(0, 5).forEach((dup, i) => {
      console.log(`\nDuplicate ${i + 1}:`);
      console.log(`Hash: ${dup.hash}`);
      console.log(`Original inserted: ${dup.original.inserted_at}`);
      console.log(`Duplicate inserted: ${dup.duplicate.inserted_at}`);
      console.log(`Original: ${dup.original.sale_date} | ¥${dup.original.selling_price} | ${dup.original.type}`);
      console.log(`Duplicate: ${dup.duplicate.sale_date} | ¥${dup.duplicate.selling_price} | ${dup.duplicate.type}`);
    });
  } else {
    console.log('No duplicate row_hash values found.');
  }

  // Check unique combinations without hash
  const uniqueKeys = new Set();
  const semanticDuplicates = [];

  data.forEach(row => {
    const key = `${row.sale_date}|${row.selling_price}|${row.type}|${row.model_number}|${row.material}`;
    if (uniqueKeys.has(key)) {
      semanticDuplicates.push(row);
    } else {
      uniqueKeys.add(key);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log(`Unique data combinations: ${uniqueKeys.size}`);
  console.log(`Potential semantic duplicates: ${semanticDuplicates.length}`);

  // Check upload logs
  const { data: logs, error: logError } = await supabase
    .from('ingest_logs')
    .select('*')
    .like('filename', '%moncler%')
    .order('created_at', { ascending: false });

  if (!logError && logs) {
    console.log('\n' + '='.repeat(80));
    console.log('Upload history:');
    logs.forEach(log => {
      console.log(`${log.created_at}: ${log.filename} - Processed: ${log.processed}, Inserted: ${log.inserted}`);
    });
  }
}

checkDuplicates().then(() => process.exit(0));