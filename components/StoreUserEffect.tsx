'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'

export default function StoreUserEffect() {
  const { isLoaded, isSignedIn } = useUser()
  const storeUser = useMutation(api.users.storeUser)

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      storeUser()
    }
  }, [isLoaded, isSignedIn, storeUser])

  return null
}
