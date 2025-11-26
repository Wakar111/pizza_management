import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars from server/.env
dotenv.config({ path: resolve(__dirname, '../../server/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettings() {
    console.log('Fetching restaurant_settings...');
    const { data, error } = await supabase
        .from('restaurant_settings')
        .select('*');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Settings found:', data);
    }
}

checkSettings();
