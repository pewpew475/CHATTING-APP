// src/hooks/use-auth.ts
// Lightweight auth hook powered by Firebase Auth
'use client'

import { useEffect, useState, useMemo } from 'react'
import { auth, googleProvider, firestore } from '@/lib/firebase'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

export interface AppUser {
  id: string
  email: string | null
  username?: string | null
  realName?: string | null
  profilePicture?: string | null
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const profile = await fetchOrCreateProfile(fbUser)
        setUser(profile)
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const signInEmail = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password)

  const signUpEmail = async (email: string, password: string, realName?: string, username?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (realName) await updateProfile(cred.user, { displayName: realName })
    await ensureProfileDoc(cred.user, { realName, username })
    return cred
  }

  const signInGoogle = () => signInWithPopup(auth, googleProvider)

  const logout = () => signOut(auth)

  return useMemo(() => ({ user, loading, signInEmail, signUpEmail, signInGoogle, logout }), [user, loading])
}

async function fetchOrCreateProfile(fbUser: FirebaseUser): Promise<AppUser> {
  const ref = doc(firestore, 'users', fbUser.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await ensureProfileDoc(fbUser, {})
    return {
      id: fbUser.uid,
      email: fbUser.email,
      username: fbUser.displayName ?? null,
      realName: fbUser.displayName ?? null,
      profilePicture: fbUser.photoURL ?? null,
    }
  }
  const data = snap.data() as any
  return {
    id: fbUser.uid,
    email: fbUser.email,
    username: data.username ?? null,
    realName: data.realName ?? fbUser.displayName ?? null,
    profilePicture: data.profilePicture ?? fbUser.photoURL ?? null,
  }
}

async function ensureProfileDoc(fbUser: FirebaseUser, opts: { realName?: string; username?: string }) {
  const ref = doc(firestore, 'users', fbUser.uid)
  const data = {
    email: fbUser.email,
    realName: opts.realName ?? fbUser.displayName ?? null,
    username: opts.username ?? null,
    profilePicture: fbUser.photoURL ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(ref, data, { merge: true })
}