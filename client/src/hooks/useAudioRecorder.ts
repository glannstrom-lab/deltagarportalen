/**
 * Audio Recorder Hook
 * Records audio for interview sessions with playback and download capabilities
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface RecordingSegment {
  blob: Blob
  timestamp: number
  duration: number
  question?: string
}

interface UseAudioRecorderReturn {
  isRecording: boolean
  isPaused: boolean
  recordingTime: number
  segments: RecordingSegment[]
  audioSupported: boolean
  startRecording: () => Promise<boolean>
  stopRecording: () => Promise<Blob | null>
  pauseRecording: () => void
  resumeRecording: () => void
  downloadRecording: (filename?: string) => void
  saveRecording: (sessionId: string, metadata?: Record<string, unknown>) => Promise<string | null>
  clearRecording: () => void
  getRecordingBlob: () => Blob | null
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [segments, setSegments] = useState<RecordingSegment[]>([])
  const [audioSupported, setAudioSupported] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const segmentStartTimeRef = useRef<number>(0)
  const currentQuestionRef = useRef<string>('')

  // Check for audio support
  useEffect(() => {
    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    setAudioSupported(supported)
  }, [])

  // Timer for recording duration
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording, isPaused])

  const startRecording = useCallback(async (): Promise<boolean> => {
    if (!audioSupported) {
      console.error('[AudioRecorder] Audio recording not supported')
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      })

      streamRef.current = stream
      chunksRef.current = []

      // Prefer webm for better compression, fallback to wav
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/wav'

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setIsPaused(false)
      setRecordingTime(0)
      segmentStartTimeRef.current = Date.now()

      console.log('[AudioRecorder] Recording started with', mimeType)
      return true
    } catch (error) {
      console.error('[AudioRecorder] Failed to start recording:', error)
      return false
    }
  }, [audioSupported])

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null)
        return
      }

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })

        // Save as segment
        const duration = Math.round((Date.now() - segmentStartTimeRef.current) / 1000)
        setSegments(prev => [...prev, {
          blob,
          timestamp: segmentStartTimeRef.current,
          duration,
          question: currentQuestionRef.current || undefined
        }])

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }

        setIsRecording(false)
        setIsPaused(false)
        console.log('[AudioRecorder] Recording stopped, blob size:', blob.size)
        resolve(blob)
      }

      mediaRecorderRef.current.stop()
    })
  }, [])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      console.log('[AudioRecorder] Recording paused')
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      console.log('[AudioRecorder] Recording resumed')
    }
  }, [])

  const getRecordingBlob = useCallback((): Blob | null => {
    if (chunksRef.current.length === 0 && segments.length === 0) {
      return null
    }

    // Combine all segments and current chunks
    const allBlobs = [
      ...segments.map(s => s.blob),
      ...chunksRef.current
    ]

    if (allBlobs.length === 0) return null

    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm'
    return new Blob(allBlobs, { type: mimeType })
  }, [segments])

  const downloadRecording = useCallback((filename?: string) => {
    const blob = getRecordingBlob()
    if (!blob) {
      console.warn('[AudioRecorder] No recording to download')
      return
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `intervju-inspelning-${new Date().toISOString().split('T')[0]}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    console.log('[AudioRecorder] Recording downloaded')
  }, [getRecordingBlob])

  const saveRecording = useCallback(async (
    sessionId: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> => {
    const blob = getRecordingBlob()
    if (!blob) {
      console.warn('[AudioRecorder] No recording to save')
      return null
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('[AudioRecorder] User not authenticated')
        return null
      }

      const fileName = `interview-recordings/${user.id}/${sessionId}.webm`

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('user-files')
        .upload(fileName, blob, {
          contentType: blob.type,
          upsert: true
        })

      if (error) {
        console.error('[AudioRecorder] Upload failed:', error)
        return null
      }

      // Save metadata to database
      const { error: metaError } = await supabase
        .from('interview_recordings')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          file_path: data.path,
          duration: recordingTime,
          segments: segments.map(s => ({
            timestamp: s.timestamp,
            duration: s.duration,
            question: s.question
          })),
          metadata,
          created_at: new Date().toISOString()
        })

      if (metaError) {
        console.error('[AudioRecorder] Metadata save failed:', metaError)
        // Don't fail completely, file is uploaded
      }

      console.log('[AudioRecorder] Recording saved to:', data.path)
      return data.path
    } catch (error) {
      console.error('[AudioRecorder] Save failed:', error)
      return null
    }
  }, [getRecordingBlob, recordingTime, segments])

  const clearRecording = useCallback(() => {
    chunksRef.current = []
    setSegments([])
    setRecordingTime(0)
    currentQuestionRef.current = ''
    console.log('[AudioRecorder] Recording cleared')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return {
    isRecording,
    isPaused,
    recordingTime,
    segments,
    audioSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    downloadRecording,
    saveRecording,
    clearRecording,
    getRecordingBlob
  }
}

export default useAudioRecorder
