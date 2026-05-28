'use client'

/**
 * Lazy boundary for ChatView.
 *
 * `next/dynamic` with `ssr: false` must live in a Client Component to actually
 * defer the bundle. Importing this from a Server Component keeps chat-view.tsx
 * (+ supabase-client) out of the initial page chunk.
 */

import dynamic from 'next/dynamic'
import type { ChatView } from './chat-view'

const ChatViewDynamic = dynamic(() => import('./chat-view').then((m) => m.ChatView), { ssr: false })

type ChatViewProps = React.ComponentProps<typeof ChatView>

export function LazyChatView(props: ChatViewProps) {
  return <ChatViewDynamic {...props} />
}
