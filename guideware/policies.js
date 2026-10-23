export const POLICIES = {
  money: {
    currency: 'INR',
    decimals: 0,
  },
  payment: {
    minAmount: 1,
    maxAmount: 100000,
    dailyLimit: 200000,
    coolingPeriodMs: 30000,
    bankRetryDelaysMs: [2000, 5000, 10000],
    maxBankRetries: 3,
  },
  scam: {
    newPayeeThreshold: 10000,
    highVelocityCount: 4,
    velocityWindowMs: 60000,
    riskWeights: {
      newPayeeHighAmount: 45,
      repeatedRecipient: 30,
      unsualTime: 10,
      exceedsDailyPattern: 25,
    },
    warnThreshold: 50,
    blockThreshold: 80,
  },
  emi: {
    minimumBuffer: 1000,
  },
  family: {
    approvalThreshold: 5000,
    maxMembers: 6,
    memberMonthlyCap: 25000,
  },
  killSwitch: {
    lockDurationMs: 900000,
    confirmPhrase: 'PAUSE',
  },
  dispute: {
    raiseWindowMs: 259200000,
    resolutionWindowMs: 604800000,
  },
  assistant: {
    maxMessageLength: 500,
  },
  bankShield: {
    offlineQueueLimit: 100,
  },
  balanceRadar: {
    forecastDays: 30,
    lowBalanceThreshold: 5000,
  },
  auth: { otpLength: 6, otpExpiryMs: 300000, resendCooldownMs: 30000, maxOtpAttempts: 5, lockoutMs: 900000, otpRequestsPerNumberPerHour: 5 },
  profile: { displayNameRequired: true, bioMaxChars: 120, avatarMaxBytes: 2097152, avatarFormats: ['png','jpg','jpeg','webp'], avatarSizePx: 256 },
  minors: { minimumAge: 10, adultAge: 18, guardianConsentRequiredBelow: 18 },
  bankLinking: { maxAccounts: 5, digitsOnlyInUi: true, accountNumberPersistedDigits: 4 },
  qr: { amountQrExpiryMs: 900000 },
  tabs: {
    primary: ['Home', 'History', 'Assistant', 'Balance', 'Profile'],
    order: ['Home', 'History', 'Assistant', 'Balance', 'Profile'],
  },
  widgets: {
    columns: { mobile: 1, tablet: 2, desktop: 3 },
    list: [
      'balance',
      'quick_pay',
      'family_circle',
      'where_is_my_money',
      'disputes',
      'safety',
      'balance_radar',
      'assistant',
      'recent_activity',
      'receive_money',
    ],
    order: [
      'balance',
      'quick_pay',
      'family_circle',
      'where_is_my_money',
      'disputes',
      'safety',
      'balance_radar',
      'assistant',
      'recent_activity',
      'receive_money',
    ],
    spans: {
      quick_pay: { mobile: 1, tablet: 1, desktop: 2 },
      recent_activity: { mobile: 2, tablet: 2, desktop: 2 },
      receive_money: { mobile: 1, tablet: 1, desktop: 1 },
    },
  },
}
