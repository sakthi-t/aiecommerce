import { useAuth } from '@clerk/clerk-react'
import { useMutation } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { startVapiSession } from '../api/supportApi'
import VapiCallRoom from '../components/support/VapiCallRoom'

export default function ContactPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth()
  const startedRef = useRef(false)
  const [sessionData, setSessionData] = useState<{
    sessionId: number
    assistantId: string
    publicKey: string
    customerName: string
    vapiConversationId: string
    ctxInfo: string
  } | null>(null)

  const startMutation = useMutation({
    mutationFn: () => startVapiSession(getToken),
    onSuccess: (data) => {
      if (startedRef.current) return
      startedRef.current = true
      setSessionData({
        sessionId: data.session_id,
        assistantId: data.vapi_assistant_id,
        publicKey: data.vapi_public_key,
        customerName: data.customer_name,
        vapiConversationId: data.vapi_conversation_id,
        ctxInfo: data.ctx_info,
      })
    },
  })

  const handleEndCall = () => {
    startedRef.current = false
    setSessionData(null)
  }

  if (!isLoaded) return null

  if (sessionData) {
    return (
      <VapiCallRoom
        publicKey={sessionData.publicKey}
        assistantId={sessionData.assistantId}
        customerName={sessionData.customerName}
        vapiConversationId={sessionData.vapiConversationId}
        ctxInfo={sessionData.ctxInfo}
        sessionId={sessionData.sessionId}
        onEnd={handleEndCall}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="rounded-2xl bg-white shadow-sm border p-10">
        <div className="mb-6">
          <span className="inline-block rounded-full bg-blue-50 text-blue-600 px-4 py-1 text-sm font-medium mb-4">
            AI-Powered Support
          </span>
          <h2 className="text-3xl font-bold mb-2">Need help with your order?</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Speak with <strong>Haney</strong>, our AI customer support assistant. Available to answer questions about your orders and our bookstore.
          </p>
        </div>

        {!isSignedIn ? (
          <div className="rounded-xl bg-gray-50 border p-6">
            <p className="text-gray-600 mb-3">Sign in to talk with Haney.</p>
            <a
              href="/"
              className="inline-block rounded-lg bg-gray-900 text-white px-6 py-2.5 hover:bg-gray-800 font-medium"
            >
              Go to Sign In
            </a>
          </div>
        ) : (
          <>
            <button
              onClick={() => {
                if (startedRef.current) return
                startMutation.mutate()
              }}
              disabled={startMutation.isPending || startedRef.current}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-8 py-3.5 text-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {startMutation.isPending ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Starting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Call Haney
                </>
              )}
            </button>
            {startMutation.isError && (
              <p className="mt-3 text-sm text-red-600">
                {startMutation.error instanceof Error ? startMutation.error.message : 'Failed to start session'}
              </p>
            )}
          </>
        )}

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-500">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="font-semibold text-gray-700 mb-1">Order Questions</p>
            <p>Check order status, delivery info</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="font-semibold text-gray-700 mb-1">Book Help</p>
            <p>Find books, get recommendations</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="font-semibold text-gray-700 mb-1">24/7 Available</p>
            <p>Talk anytime, no waiting</p>
          </div>
        </div>
      </div>
    </div>
  )
}
