import { formatDateTime } from '../dateTimeUtils'

describe('dateTimeUtils', () => {
  describe('formatDateTime', () => {
    it('formats datetime string correctly', () => {
      const result = formatDateTime('2025-01-20T14:30:00Z')
      expect(result).toMatch(/20-01.*15:30/) // UTC+1 timezone
    })
    
    it('handles invalid date', () => {
      const result = formatDateTime('invalid-date')
      expect(result).toContain('Invalid Date')
    })
    
    it('handles null/undefined', () => {
      expect(formatDateTime(null)).toBe('')
      expect(formatDateTime(undefined)).toBe('')
    })
  })
})