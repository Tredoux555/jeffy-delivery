'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { Input } from './Input'
import { createClient } from '@/lib/supabase'
import { DeliveryMessage } from '@/types/database'
import {
  X,
  Send,
  Mic,
  MicOff,
  Phone,
  MessageSquare,
  User,
  Truck,
  Check,
  CheckCheck
} from 'lucide-react'

interface ChatDialogProps {
  notificationId: string
  userType: 'driver' | 'receiver'
  userId: string
  otherUserName: string
  otherUserPhone?: string
  onClose: () => void
}

export function ChatDialog({ 
  notificationId, 
  userType, 
  userId, 
  otherUserName,
  otherUserPhone,
  onClose 
}: ChatDialogProps) {
  const [messages, setMessages] = useState<DeliveryMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    fetchMessages()
    setupRealtimeSubscription()
  }, [notificationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('delivery_messages')
        .select('*')
        .eq('delivery_notification_id', notificationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const supabase = createClient()
    
    const channel = supabase
      .channel(`chat-${notificationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_messages',
          filter: `delivery_notification_id=eq.${notificationId}`
        },
        (payload) => {
          const newMsg = payload.new as DeliveryMessage
          setMessages(prev => [...prev, newMsg])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const sendMessage = async (content: string, messageType: 'text' | 'voice' = 'text', voiceUrl?: string) => {
    if (!content.trim() && messageType === 'text') return

    setSending(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('delivery_messages')
        .insert({
          delivery_notification_id: notificationId,
          sender_type: userType,
          sender_id: userId,
          message_type: messageType,
          content: content.trim() || null,
          voice_url: voiceUrl || null
        })

      if (error) throw error
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(newMessage)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        // In production, upload to storage and get URL
        // For now, we'll just send a text message indicating voice note
        sendMessage('🎤 Voice message', 'voice')
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Unable to access microphone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <Card className="w-full sm:max-w-lg h-[85vh] sm:h-[600px] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-jeffy-yellow to-jeffy-yellow-dark">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              {userType === 'driver' ? (
                <User className="w-5 h-5 text-gray-700" />
              ) : (
                <Truck className="w-5 h-5 text-gray-700" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{otherUserName}</h3>
              <p className="text-xs text-gray-700">
                {userType === 'driver' ? 'Customer' : 'Delivery Driver'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {otherUserPhone && (
              <button
                onClick={() => window.open(`tel:${otherUserPhone}`, '_self')}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <Phone className="w-5 h-5 text-gray-900" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-900" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {loading ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-gray-500">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No messages yet</p>
              <p className="text-sm text-gray-500">Send a message to start the conversation</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_type === userType
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      isOwnMessage
                        ? 'bg-jeffy-yellow text-gray-900 rounded-br-sm'
                        : 'bg-white text-gray-900 shadow-sm rounded-bl-sm'
                    }`}
                  >
                    {message.message_type === 'voice' ? (
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4" />
                        <span className="text-sm">Voice message</span>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <div className={`flex items-center gap-1 mt-1 ${
                      isOwnMessage ? 'justify-end' : 'justify-start'
                    }`}>
                      <span className="text-xs opacity-70">
                        {formatTime(message.created_at)}
                      </span>
                      {isOwnMessage && (
                        message.read_at ? (
                          <CheckCheck className="w-3 h-3 text-blue-600" />
                        ) : (
                          <Check className="w-3 h-3 opacity-70" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`p-3 rounded-full transition-colors ${
                recording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {recording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-jeffy-yellow"
              disabled={recording}
            />
            
            <button
              onClick={() => sendMessage(newMessage)}
              disabled={!newMessage.trim() || sending}
              className="p-3 bg-jeffy-yellow text-gray-900 rounded-full hover:bg-jeffy-yellow-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

