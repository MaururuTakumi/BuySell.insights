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

async function checkBrands() {
  const { data, error } = await supabase
    .from('sales')
    .select('brand, type, model_number, material, selling_price')
    .order('updated_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Recently uploaded records with extracted brands:');
  console.log('='.repeat(80));
  data.forEach((row, i) => {
    console.log(`${i + 1}. Brand: ${row.brand}`);
    console.log(`   Type: ${row.type || 'N/A'}, Model: ${row.model_number || 'N/A'}`);
    console.log(`   Material: ${row.material || 'N/A'}, Price: ¥${row.selling_price.toLocaleString()}`);
    console.log('-'.repeat(40));
  });
}

checkBrands().then(() => process.exit(0));