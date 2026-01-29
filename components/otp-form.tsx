'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export function OTPForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [otp, setOtp] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

  useEffect(() => {
    // Get email from localStorage
    const savedEmail = localStorage.getItem('forgotPasswordEmail')
    if (!savedEmail) {
      setError('Email not found. Please start from forgot password page.')
      setTimeout(() => router.push('/forgot-password'), 2000)
      return
    }
    setEmail(savedEmail)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/mentor-auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Invalid OTP')
        return
      }

      setSuccess('OTP verified successfully!')
      // Store OTP for next step
      localStorage.setItem('forgotPasswordOTP', otp)
      // Redirect to reset password
      setTimeout(() => {
        router.push('/reset-password')
      }, 1500)
    } catch (err) {
      setError('Error verifying OTP. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    setError('')
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
        setError(data.message || 'Failed to resend OTP')
        return
      }

      setSuccess('OTP resent to your email!')
      setOtp('')
    } catch (err) {
      setError('Error resending OTP. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Enter verification code</CardTitle>
        <CardDescription>We sent a 6-digit code to your email.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {error && <div className='text-red-600 text-sm mb-4'>{error}</div>}
          {success && <div className='text-green-600 text-sm mb-4 flex items-center gap-2'>
            <div className='animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full'></div>
            {success}
          </div>}
          
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="otp">Verification code</FieldLabel>
              <InputOTP
                maxLength={6}
                id="otp"
                value={otp}
                onChange={setOtp}
                disabled={loading}
                required
              >
                <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <FieldDescription>
                Enter the 6-digit code sent to your email.
              </FieldDescription>
            </Field>
            <FieldGroup>
              <Button type="submit" disabled={loading} className='w-full'>
                {loading ? (
                  <span className='flex items-center gap-2'>
                    <div className='animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full'></div>
                    Verifying...
                  </span>
                ) : (
                  'Verify'
                )}
              </Button>
              <FieldDescription className="text-center">
                Didn&apos;t receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-blue-600 hover:underline disabled:opacity-50"
                >
                  Resend
                </button>
              </FieldDescription>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
