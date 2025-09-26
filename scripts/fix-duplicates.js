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

async function removeDuplicates() {
  // Get all MONCLER records ordered by insertion time
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('brand', 'MONCLER')
    .order('inserted_at', { ascending: true });

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  console.log(`Total MONCLER records before cleanup: ${data.length}`);

  // Group records by unique data combination
  const uniqueDataMap = {};
  const toDelete = [];

  data.forEach(row => {
    // Create a unique key based on actual data (not hash)
    const key = `${row.sale_date}|${row.selling_price}|${row.type || ''}|${row.rank || ''}|${row.model_number || ''}|${row.material || ''}|${row.adjusted_exp_sale_price || 0}|${row.appraised_price || 0}`;

    if (!uniqueDataMap[key]) {
      // Keep the first occurrence (oldest)
      uniqueDataMap[key] = row;
    } else {
      // Mark duplicates for deletion
      toDelete.push(row.id);
    }
  });

  console.log(`Unique records: ${Object.keys(uniqueDataMap).length}`);
  console.log(`Duplicates to delete: ${toDelete.length}`);

  if (toDelete.length > 0) {
    console.log('\nDeleting duplicates...');

    // Delete in batches
    const batchSize = 50;
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize);
      const { error: deleteError } = await supabase
        .from('sales')
        .delete()
        .in('id', batch);

      if (deleteError) {
        console.error(`Error deleting batch ${i / batchSize + 1}:`, deleteError);
      } else {
        console.log(`Deleted batch ${i / batchSize + 1} (${batch.length} records)`);
      }
    }

    // Verify cleanup
    const { count } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('brand', 'MONCLER');

    console.log(`\nTotal MONCLER records after cleanup: ${count}`);
    console.log('✅ Cleanup completed!');
  } else {
    console.log('No duplicates found.');
  }
}

// Confirm before running
console.log('This script will remove duplicate MONCLER records from the database.');
console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...');

setTimeout(() => {
  removeDuplicates().then(() => process.exit(0));
}, 3000);