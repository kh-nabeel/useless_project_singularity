import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destination_url, label } = body;

    // Validate URL
    if (!destination_url || !/^https?:\/\//i.test(destination_url)) {
      return NextResponse.json(
        { error: 'Invalid URL. Must start with http:// or https://' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('qr_codes')
      .insert({ destination_url, label: label || null })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to create QR code' }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error('API /qr error:', err);
    return NextResponse.json({ error: 'Internal server error or invalid configuration' }, { status: 500 });
  }
}
