import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Supabase Key:', supabaseKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment');
  throw new Error('Supabase configuration missing');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5174');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request for /api/personas');
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { name, selected_at } = req.body;
    console.log('POST /api/personas received:', { name, selected_at });

    if (!name || !selected_at) {
      console.error('Validation failed: Missing name or selected_at');
      res.status(400).json({ error: 'Missing name or selected_at' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('personas')
        .insert([{ name, selected_at: new Date(selected_at) }])
        .select();

      if (error) {
        console.error('Supabase insert error:', JSON.stringify(error, null, 2));
        res.status(500).json({ error: `Supabase error: ${error.message}`, details: error });
        return;
      }

      console.log('Persona saved to Supabase:', name, 'Data:', JSON.stringify(data, null, 2));
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Server error:', JSON.stringify(error, null, 2));
      res.status(500).json({ error: `Server error: ${error.message}`, details: error });
      return;
    }
  } else {
    console.error(`Method ${req.method} not allowed`);
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return;
  }
}