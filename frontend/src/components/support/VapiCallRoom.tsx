import { useEffect, useRef, useState } from 'react'

interface VapiCallRoomProps {
  publicKey: string
  assistantId: string
  customerName: string
  vapiConversationId: string
  ctxInfo: string
  sessionId: number
  onEnd: () => void
}

export default function VapiCallRoom({ publicKey, assistantId, customerName, vapiConversationId, ctxInfo, sessionId, onEnd }: VapiCallRoomProps) {
  const vapiRef = useRef<any>(null)
  const endedRef = useRef(false)
  const [status, setStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting')

  useEffect(() => {
    if (vapiRef.current) return

    const doEnd = () => {
      if (endedRef.current) return
      endedRef.current = true
      setStatus('ended')
      vapiRef.current?.stop()
      setTimeout(() => onEnd(), 800)
    }

    import('@vapi-ai/web').then((mod) => {
      if (vapiRef.current) return

      const Vapi = (mod as any).default?.default || (mod as any).default || mod
      const vapi = new Vapi(publicKey)
      vapiRef.current = vapi

      vapi.on('call-end', () => doEnd())
      vapi.on('call-start', () => setStatus('connected'))
      vapi.on('call-start-failed', () => doEnd())

      vapi.start(assistantId, {
        variableValues: {
          customer_name: customerName,
          vapi_conversation_id: vapiConversationId,
          ctx_info: ctxInfo,
        },
      }).catch(() => doEnd())
    })
  }, [])

  const handleEnd = () => {
    if (endedRef.current) return
    endedRef.current = true
    vapiRef.current?.stop()
    onEnd()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="rounded-2xl bg-white shadow-sm border overflow-hidden">
        <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Support Call with Haney</h3>
            <p className="text-sm text-gray-400">
              Session #{sessionId}
              {status === 'connected' && <span className="ml-2 text-green-400">● Connected</span>}
              {status === 'connecting' && <span className="ml-2 text-yellow-400">● Connecting...</span>}
            </p>
          </div>
          <button
            onClick={handleEnd}
            className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium"
          >
            End Call
          </button>
        </div>

        <div className="p-6">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            {status === 'connected' ? (
              <>
                <p className="text-lg font-medium text-gray-700">You're connected to Haney</p>
                <p className="text-sm text-gray-500 mt-1">Speak naturally — Haney is listening</p>
              </>
            ) : status === 'connecting' ? (
              <p className="text-lg font-medium text-gray-700">Connecting to Haney...</p>
            ) : (
              <p className="text-lg font-medium text-gray-700">Call ended</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
