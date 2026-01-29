'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!email) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/mentor-auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to send OTP')
        return
      }

      setSuccess('OTP sent to your email!')
      // Store email for next step and redirect after 2 seconds
      localStorage.setItem('forgotPasswordEmail', email)
      setTimeout(() => {
        router.push('/otp')
      }, 2000)
    } catch (err) {
      setError('Error sending OTP. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className='space-y-4' onSubmit={handleSubmit}>
      {error && <div className='text-red-600 text-sm'>{error}</div>}
      {success && <div className='text-green-600 text-sm flex items-center gap-2'>
        <div className='animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full'></div>
        {success}
      </div>}

      {/* Email */}
      <div className='space-y-1'>
        <Label className='leading-5' htmlFor='userEmail'>
          Email address*
        </Label>
        <Input
          type='email'
          id='userEmail'
          placeholder='Enter your email address'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <Button className='w-full' type='submit' disabled={loading}>
        {loading ? (
          <span className='flex items-center gap-2'>
            <div className='animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full'></div>
            Sending...
          </span>
        ) : (
          'Get OTP'
        )}
      </Button>
    </form>
  )
}

export default ForgotPasswordForm
