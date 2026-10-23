import { useEffect, useState } from 'react'
import MobileEntryScreen from './mobile-entry-screen.jsx'
import OtpVerifyScreen from './otp-verify-screen.jsx'
import ProfileSetupScreen from './profile-setup-screen.jsx'

export default function AuthGateFlow({ onAuthenticated }) {
  const [stage, setStage] = useState('mobile')
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (stage === 'mobile') setError('')
  }, [stage])

  if (stage === 'mobile') {
    return (
      <MobileEntryScreen
        mobile={mobile}
        setMobile={setMobile}
        error={error}
        onContinue={() => {
          if (!/^[6-9][0-9]{9}$/.test(mobile)) { setError('Enter a valid 10-digit mobile number'); return }
          setError('')
          setStage('otp')
        }}
      />
    )
  }

  if (stage === 'otp') {
    return (
      <OtpVerifyScreen
        mobile={mobile}
        otp={otp}
        setOtp={setOtp}
        error={error}
        onBack={() => setStage('mobile')}
        onVerify={() => {
          if (otp.length !== 6) { setError('Enter the 6 digit OTP'); return }
          setError('')
          setStage('profile')
        }}
      />
    )
  }

  return (
    <ProfileSetupScreen
      name={name}
      setName={setName}
      dob={dob}
      setDob={setDob}
      bio={bio}
      setBio={setBio}
      error={error}
      onSave={() => {
        if (!name.trim() || !dob) { setError('Name and date of birth are required'); return }
        setError('')
        onAuthenticated()
      }}
    />
  )
}
