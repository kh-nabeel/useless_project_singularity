import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase.rpc('increment_completed_count', { row_id: id });

  // Fallback if RPC not set up: just increment manually
  if (error) {
    const { data } = await supabase
      .from('qr_codes')
      .select('completed_count')
      .eq('id', id)
      .single();

    if (data) {
      await supabase
        .from('qr_codes')
        .update({ completed_count: (data.completed_count || 0) + 1 })
        .eq('id', id);
    }
  }

  return NextResponse.json({ success: true });
}
