'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, BarChart3 } from 'lucide-react';

export default function CreatePoll() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert([{ question }])
      .select()
      .single();

    if (pollError || !pollData) {
      setLoading(false);
      return alert('Error creating poll');
    }

    const optionsToInsert = options
      .filter(opt => opt.trim() !== '')
      .map(opt => ({ poll_id: pollData.id, text: opt }));

    const { error: optionsError } = await supabase.from('options').insert(optionsToInsert);
    
    if (!optionsError) {
      router.push(`/poll/${pollData.id}`);
    } else {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-indigo-200">
            <BarChart3 className="text-indigo-600 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create a Poll</h1>
          <p className="text-gray-500 mt-2">Design your question and share it instantly.</p>
        </div>

        <form onSubmit={handleCreate} className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Your Question</label>
            <input
              required
              type="text"
              placeholder="e.g., What's the best programming language?"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div className="space-y-3 mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Options</label>
            {options.map((opt, i) => (
               <div key={i} className="flex gap-3 items-center group">
                <input
                  required
                  type="text"
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...options];
                    newOpts[i] = e.target.value;
                    setOptions(newOpts);
                  }}
                />
                {options.length > 2 && (
                  <button 
                    type="button" 
                    onClick={() => setOptions(options.filter((_, idx) => idx !== i))} 
                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title="Remove option"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button 
            type="button" 
            onClick={() => setOptions([...options, ''])} 
            className="flex items-center justify-center w-full gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 p-3 rounded-xl font-medium transition-colors mb-8 border border-indigo-100"
          >
            <Plus size={18} /> Add another option
          </button>

          <button 
            disabled={loading} 
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl font-bold shadow-md hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {loading ? (
               <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'Create & Share Poll'}
          </button>
        </form>
      </div>
    </main>
  );
}