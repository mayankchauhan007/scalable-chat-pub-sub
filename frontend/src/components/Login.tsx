import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_USER, GET_USERS } from '../graphql/queries';
import type { CurrentUser } from '../App';

interface LoginProps {
  onLogin: (user: CurrentUser) => void;
}

function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState<'select' | 'create'>('select');

  const { data, loading, refetch } = useQuery(GET_USERS);
  const [createUser, { loading: creating }] = useMutation(CREATE_USER);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    try {
      const { data } = await createUser({
        variables: { input: { username: username.trim() } },
      });
      onLogin(data.createUser);
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Real-Time Chat</h1>
        <p className="text-gray-400 text-center mb-6">Select a user or create a new one</p>

        {mode === 'select' ? (
          <>
            {loading ? (
              <p className="text-gray-400 text-center">Loading users...</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {data?.users?.length === 0 && (
                  <p className="text-gray-500 text-center text-sm">No users yet. Create one below.</p>
                )}
                {data?.users?.map((user: any) => (
                  <button
                    key={user.id}
                    onClick={() => onLogin(user)}
                    className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-indigo-600 transition text-white"
                  >
                    <span className="font-medium">{user.username}</span>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setMode('create')}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
            >
              + Create New User
            </button>
          </>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Username *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="e.g. john_doe"
                minLength={3}
                maxLength={30}
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setMode('select'); refetch(); }}
                className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create & Login'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;
