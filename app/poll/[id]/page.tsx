'use client';
import { useEffect, useState, use } from 'react';
import { supabase } from '../../../lib/supabase';
import { AlertCircle, CheckCircle2, Copy } from 'lucide-react';

export default function PollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [poll, setPoll] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(`voted_${id}`)) {
      setHasVoted(true);
    }

    const fetchPoll = async () => {
      const { data: p } = await supabase.from('polls').select('*').eq('id', id).single();
      const { data: o } = await supabase.from('options').select('*').eq('poll_id', id).order('id');
      setPoll(p);
      setOptions(o || []);
    };
    fetchPoll();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'options' }, (payload) => {
        setOptions((current) => 
          current.map((opt) => opt.id === payload.new.id ? payload.new : opt)
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleVote = async (optionId: string) => {
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: id, optionId })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      localStorage.setItem(`voted_${id}`, 'true');
      setHasVoted(true);
      setError('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!poll) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-8 pt-16 sm:pt-24">
      <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100 w-full max-w-xl">
        
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-8 text-gray-900 leading-tight">
          {poll.question}
        </h1>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-4 mb-8">
          {options.map((opt) => {
            const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            return (
              <div key={opt.id} className="relative bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden group">
                {/* The Progress Bar Fill */}
                <div 
                  className="absolute top-0 left-0 h-full bg-indigo-100 transition-all duration-1000 ease-out" 
                  style={{ width: `${hasVoted ? percentage : 0}%` }} 
                />
                
                <button
                  disabled={hasVoted}
                  onClick={() => handleVote(opt.id)}
                  className={`relative z-10 w-full p-4 sm:p-5 flex justify-between items-center text-left transition-all ${!hasVoted ? 'hover:bg-gray-100/50 cursor-pointer' : 'cursor-default'}`}
                >
                  <span className={`font-semibold text-base sm:text-lg ${hasVoted ? 'text-gray-900' : 'text-gray-700'}`}>
                    {opt.text}
                  </span>
                  
                  {hasVoted && (
                     <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 font-medium">{opt.votes} votes</span>
                        <span className="text-base font-bold text-indigo-700 bg-white/50 px-2 py-1 rounded-md min-w-[3rem] text-center">
                          {percentage}%
                        </span>
                     </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
        
        {hasVoted && (
          <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold mb-6 bg-emerald-50 py-3 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
            <span>Vote recorded! Real-time results are live.</span>
          </div>
        )}
        
        <div className="mt-8 pt-6 border-t border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Share this poll</label>
          <div className="flex gap-2">
            <input 
              readOnly 
              value={typeof window !== 'undefined' ? window.location.href : ''} 
              className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 outline-none truncate" 
              onClick={e => e.currentTarget.select()} 
            />
            <button 
              onClick={copyToClipboard}
              className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 transition-colors flex items-center gap-2 font-medium shrink-0"
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}