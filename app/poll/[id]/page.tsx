'use client';
import { useEffect, useState, use } from 'react'; // 1. Import 'use' from react
import { supabase } from '../../../lib/supabase';

// 2. Update the type of params to be a Promise
export default function PollPage({ params }: { params: Promise<{ id: string }> }) {
  // 3. Unwrap the params using React.use()
  const { id } = use(params); 
  
  const [poll, setPoll] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check Local Storage using the unwrapped 'id'
    if (localStorage.getItem(`voted_${id}`)) {
      setHasVoted(true);
    }

    // Fetch initial data
    const fetchPoll = async () => {
      const { data: p } = await supabase.from('polls').select('*').eq('id', id).single();
      const { data: o } = await supabase.from('options').select('*').eq('poll_id', id).order('id');
      setPoll(p);
      setOptions(o || []);
    };
    fetchPoll();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'options' }, (payload) => {
        setOptions((current) => 
          current.map((opt) => opt.id === payload.new.id ? payload.new : opt)
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]); // Update dependency array to use the unwrapped 'id'

  const handleVote = async (optionId: string) => {
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: id, optionId }) // Use the unwrapped 'id' here too
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      localStorage.setItem(`voted_${id}`, 'true');
      setHasVoted(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!poll) return <div className="p-8 text-center text-black">Loading poll...</div>;

  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <main className="min-h-screen flex flex-col items-center bg-gray-50 p-4 pt-20">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">{poll.question}</h1>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        <div className="space-y-4">
          {options.map((opt) => {
            const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            return (
              <div key={opt.id} className="relative bg-gray-100 rounded-lg overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-500 ease-in-out" 
                  style={{ width: `${hasVoted ? percentage : 0}%` }} 
                />
                <button
                  disabled={hasVoted}
                  onClick={() => handleVote(opt.id)}
                  className={`relative w-full p-4 flex justify-between items-center text-left text-black transition-colors ${!hasVoted ? 'hover:bg-gray-200 cursor-pointer' : 'cursor-default'}`}
                >
                  <span className="font-medium">{opt.text}</span>
                  {hasVoted && <span className="text-sm font-bold">{opt.votes} votes ({percentage}%)</span>}
                </button>
              </div>
            );
          })}
        </div>
        
        {hasVoted && <p className="mt-6 text-center text-green-600 font-medium">Thanks for voting! Results are updating in real-time.</p>}
        
        <div className="mt-8 pt-4 border-t text-sm text-gray-500 text-center flex flex-col items-center">
          <p>Share this poll:</p>
          <input readOnly value={typeof window !== 'undefined' ? window.location.href : ''} className="mt-2 w-full p-2 bg-gray-100 rounded text-center text-xs" onClick={e => e.currentTarget.select()} />
        </div>
      </div>
    </main>
  );
}