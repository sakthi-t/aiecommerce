import { useAuth } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { fetchMyProfile } from '../api/usersApi'

interface Props {
  children: ReactNode
}

export default function ProtectedLayout({ children }: Props) {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => fetchMyProfile(getToken),
    enabled: isLoaded && (isSignedIn ?? false),
    retry: false,
  })

  if (!isLoaded || isLoading) return null

  if (!isSignedIn || isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-10 bg-white rounded-xl shadow-sm border max-w-md">
          <h2 className="text-xl font-semibold mb-2">Account Deactivated</h2>
          <p className="text-gray-500 mb-6">Your account has been deactivated. Please contact support for assistance.</p>
          <a href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Return to Home
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
