'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ResetPasswordForm = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

  useEffect(() => {
    // Get email from localStorage
    const savedEmail = localStorage.getItem('forgotPasswordEmail')
    const savedOtp = localStorage.getItem('forgotPasswordOTP')
    
    if (!savedEmail) {
      setError('Email not found. Please start from forgot password page.')
      setTimeout(() => router.push('/forgot-password'), 2000)
      return
    }
    
    setEmail(savedEmail)
    setOtp(savedOtp || '')
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (!password || !confirmPassword) {
      setError('Please enter both passwords')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/mentor-auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
          newPassword: password,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to reset password')
        return
      }

      setSuccess('Password reset successfully! Redirecting to login...')
      
      // Clear stored data
      localStorage.removeItem('forgotPasswordEmail')
      localStorage.removeItem('forgotPasswordOTP')
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      setError('Error resetting password. Please try again.')
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
      
      {/* Password */}
      <div className='w-full space-y-1'>
        <Label className='leading-5' htmlFor='password'>
          New Password*
        </Label>
        <div className='relative'>
          <Input
            id='password'
            type='password'
            placeholder='••••••••••••••••'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>
      </div>

      {/* Confirm Password */}
      <div className='w-full space-y-1'>
        <Label className='leading-5' htmlFor='confirmPassword'>
          Confirm Password*
        </Label>
        <div className='relative'>
          <Input
            id='confirmPassword'
            type='password'
            placeholder='••••••••••••••••'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>
      </div>

      <Button className='w-full' type='submit' disabled={loading}>
        {loading ? (
          <span className='flex items-center gap-2'>
            <div className='animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full'></div>
            Resetting...
          </span>
        ) : (
          'Set New Password'
        )}
      </Button>
    </form>
  )
}

export default ResetPasswordForm
