import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(req: Request) {
  const { pollId, optionId } = await req.json();
  
  // Anti-abuse: Get user IP address
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown-ip';

  // Try to log the vote (will fail if IP already voted on this poll due to Unique constraint)
  const { error: logError } = await supabase
    .from('vote_logs')
    .insert([{ poll_id: pollId, ip_address: ip }]);

  if (logError) {
    return NextResponse.json({ error: 'You have already voted on this poll.' }, { status: 403 });
  }

  // Increment the vote count
  const { error: updateError } = await supabase.rpc('increment_vote', { option_id: optionId });

  // Fallback if you don't want to create an RPC (Stored Procedure), do a standard update:
  const { data: currentOpt } = await supabase.from('options').select('votes').eq('id', optionId).single();
  if (currentOpt) {
      await supabase.from('options').update({ votes: currentOpt.votes + 1 }).eq('id', optionId);
  }

  return NextResponse.json({ success: true });
}