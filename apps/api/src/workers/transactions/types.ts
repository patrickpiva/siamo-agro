export interface AutoCancelJobData {
  type: 'auto-cancel'
  transactionId: string
}

export interface StaleProgressAlertJobData {
  type: 'stale-progress-alert'
  transactionId: string
}

export type TransactionJobData = AutoCancelJobData | StaleProgressAlertJobData
