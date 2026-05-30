import { LiveKitRoom, RoomAudioRenderer, ControlBar } from '@livekit/components-react'
import '@livekit/components-styles'
import { useState } from 'react'

interface CallRoomProps {
  token: string
  serverUrl: string
  sessionId: number
  onEnd: () => void
  getToken: () => Promise<string | null>
}

export default function CallRoom({ token, serverUrl, sessionId, onEnd }: CallRoomProps) {
  const [connected, setConnected] = useState(false)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="rounded-2xl bg-white shadow-sm border overflow-hidden">
        <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Support Call with Haney</h3>
            <p className="text-sm text-gray-400">
              Session #{sessionId}
              {connected && <span className="ml-2 text-green-400">● Connected</span>}
            </p>
          </div>
          <button
            onClick={onEnd}
            className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium"
          >
            End Call
          </button>
        </div>

        <div className="p-6">
          <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connectOptions={{ autoSubscribe: true }}
            audio={true}
            video={false}
            onConnected={() => setConnected(true)}
            onDisconnected={onEnd}
            className="flex flex-col items-center gap-4"
          >
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700">You're connected to Haney</p>
              <p className="text-sm text-gray-500 mt-1">Speak naturally — Haney is listening</p>
            </div>

            <RoomAudioRenderer />
            <ControlBar variation="verbose" />
          </LiveKitRoom>
        </div>
      </div>
    </div>
  )
}
