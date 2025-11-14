const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  '',
  '',
  { auth: { persistSession: false } }
);

async function test() {
  try {
    const { data, error } = await supabase
      .from('personas')
      .insert([{ name: 'Test4', selected_at: new Date() }])
      .select();
    console.log('Insert Data:', JSON.stringify(data, null, 2));
    console.log('Insert Error:', error);

    const { data: selectData, error: selectError } = await supabase
      .from('personas')
      .select('*');
    console.log('Select Data:', JSON.stringify(selectData, null, 2));
    console.log('Select Error:', selectError);
  } catch (error) {
    console.error('Test Error:', JSON.stringify(error, null, 2));
  }
}

test();