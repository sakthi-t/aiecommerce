import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

interface Transcript {
  id: number
  speaker: string
  message: string
  timestamp: string
}

interface Session {
  id: number
  user_email: string
  user_name: string
  livekit_room_name: string
  vapi_conversation_id: string | null
  started_at: string | null
  ended_at: string | null
  duration_seconds: number | null
  rating: number | null
  feedback: string
  summary: string
  transcripts: Transcript[]
  created_at: string
}

const SPEAKER_COLORS: Record<string, string> = {
  customer: 'bg-blue-100 text-blue-700',
  agent: 'bg-green-100 text-green-700',
}

async function fetchAdminSessions(getToken: () => Promise<string | null>, page = 1) {
  const token = await getToken()
  const res = await fetch(`/api/v1/support/admin/sessions/?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch sessions')
  return res.json()
}

async function fetchSessionDetail(id: number, getToken: () => Promise<string | null>) {
  const token = await getToken()
  const res = await fetch(`/api/v1/support/admin/sessions/${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch session')
  return res.json()
}

interface Props {
  getToken: () => Promise<string | null>
}

export default function AdminSessions({ getToken }: Props) {
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sessions', page],
    queryFn: () => fetchAdminSessions(getToken, page),
  })

  const { data: detail } = useQuery({
    queryKey: ['admin-session-detail', selectedId],
    queryFn: () => fetchSessionDetail(selectedId!, getToken),
    enabled: selectedId !== null,
  })

  const sessions = data?.results ?? []
  const stats = data?.stats

  if (isLoading) return <p className="text-gray-500">Loading sessions...</p>

  if (selectedId && detail) {
    return (
      <div>
        <button
          onClick={() => setSelectedId(null)}
          className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to sessions
        </button>
        <div className="rounded-xl bg-white shadow-sm border p-6 mb-4">
          <h3 className="font-semibold text-lg mb-2">Session #{detail.id}</h3>

          {/* Rating and Summary — shown first */}
          {detail.summary && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg text-sm">
              <p className="text-gray-500 mb-1 font-semibold">AI Summary</p>
              <p>{detail.summary}</p>
            </div>
          )}
          {detail.rating != null ? (
            <div className="mb-4 p-3 bg-green-50 rounded-lg flex items-center gap-3 text-sm">
              <span className="text-lg">{'⭐'.repeat(detail.rating)}</span>
              <span className="font-medium">{detail.rating}/5</span>
              {detail.feedback && <span className="text-gray-500 italic">— {detail.feedback}</span>}
            </div>
          ) : (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-400">
              No rating yet
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <p className="text-gray-500">Customer</p>
              <p className="font-medium">{detail.user_name || detail.user_email}</p>
              <p className="text-xs text-gray-400">{detail.user_email}</p>
            </div>
            <div>
              <p className="text-gray-500">Date</p>
              <p className="font-medium">
                {detail.started_at
                  ? new Date(detail.started_at).toLocaleString()
                  : 'Not started'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Duration</p>
              <p className="font-medium">
                {detail.duration_seconds != null
                  ? `${Math.floor(detail.duration_seconds / 60)}m ${detail.duration_seconds % 60}s`
                  : '—'}
              </p>
            </div>
            {detail.vapi_conversation_id && (
              <div>
                <p className="text-gray-500">Conversation ID</p>
                <p className="font-medium text-xs font-mono truncate">{detail.vapi_conversation_id}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white shadow-sm border p-6">
          <h4 className="font-semibold mb-3">Transcript</h4>
          {!detail.transcripts?.length ? (
            <p className="text-sm text-gray-400">No transcript messages.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {detail.transcripts.map((msg: Transcript) => (
                <div key={msg.id} className="flex gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 h-fit mt-0.5 ${
                      SPEAKER_COLORS[msg.speaker] || 'bg-gray-100'
                    }`}
                  >
                    {msg.speaker}
                  </span>
                  <div>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Support Sessions</h3>

      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-white shadow-sm border p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {stats.avg_rating ? `${stats.avg_rating} ⭐` : '—'}
            </p>
            <p className="text-sm text-gray-500 mt-1">Avg Rating</p>
          </div>
          <div className="rounded-xl bg-white shadow-sm border p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.total_rated}</p>
            <p className="text-sm text-gray-500 mt-1">Rated Calls</p>
          </div>
          <div className="rounded-xl bg-white shadow-sm border p-4 text-center">
            <p className="text-2xl font-bold text-gray-700">{stats.total_sessions}</p>
            <p className="text-sm text-gray-500 mt-1">Total Calls</p>
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <p className="text-gray-500">No support sessions yet.</p>
      ) : (
        <>
          <div className="space-y-2">
            {sessions.map((session: Session) => (
              <div
                key={session.id}
                onClick={() => setSelectedId(session.id)}
                className="rounded-xl bg-white shadow-sm border p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition"
              >
                <div>
                  <p className="font-medium">
                    Session #{session.id}{' '}
                    <span className="text-sm text-gray-500">
                      by {session.user_name || session.user_email}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {session.started_at
                      ? new Date(session.started_at).toLocaleString()
                      : 'Not started'}
                    {session.duration_seconds != null &&
                      ` · ${Math.floor(session.duration_seconds / 60)}m ${session.duration_seconds % 60}s`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {session.rating != null && (
                    <span className="text-sm">{'⭐'.repeat(session.rating)}</span>
                  )}
                  <span className="text-gray-400">→</span>
                </div>
              </div>
            ))}
          </div>

          {data && data.count > 10 && (
            <div className="flex justify-center gap-4 mt-6">
              <button
                disabled={!data.previous}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded-lg border disabled:opacity-30"
              >
                Previous
              </button>
              <button
                disabled={!data.next}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-lg border disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
