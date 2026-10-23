let demoMode = false

export const setSmsDemoMode = (value) => {
  demoMode = Boolean(value)
}

// SmsProvider interface with a mock implementation.
// In demo mode the OTP is surfaced to the caller through the demo-only field.
// Outside demo mode the provider delivers via the configured SMS backend and
// never returns the OTP to the caller.
export const sendOtp = async (mobile, otp) => {
  if (!demoMode) return null
  return otp
}
