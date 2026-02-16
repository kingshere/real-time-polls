'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { PlusCircle, Trash2 } from 'lucide-react';

export default function CreatePoll() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Insert Poll
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert([{ question }])
      .select()
      .single();

    if (pollError || !pollData) return alert('Error creating poll');

    // Insert Options
    const optionsToInsert = options
      .filter(opt => opt.trim() !== '')
      .map(opt => ({ poll_id: pollData.id, text: opt }));

    const { error: optionsError } = await supabase.from('options').insert(optionsToInsert);
    
    if (!optionsError) {
      router.push(`/poll/${pollData.id}`);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={handleCreate} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Create a New Poll</h1>
        <input
          required
          type="text"
          placeholder="What's your question?"
          className="w-full p-3 border rounded-lg mb-4 text-black"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2 mb-3">
            <input
              required
              type="text"
              placeholder={`Option ${i + 1}`}
              className="flex-1 p-3 border rounded-lg text-black"
              value={opt}
              onChange={(e) => {
                const newOpts = [...options];
                newOpts[i] = e.target.value;
                setOptions(newOpts);
              }}
            />
            {options.length > 2 && (
              <button type="button" onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="p-3 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 size={20} />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setOptions([...options, ''])} className="flex items-center gap-2 text-blue-600 mb-6 hover:underline">
          <PlusCircle size={18} /> Add Option
        </button>
        <button disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition">
          {loading ? 'Creating...' : 'Create & Share Poll'}
        </button>
      </form>
    </main>
  );
}