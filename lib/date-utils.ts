
import { format, parse, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Standard Date Format: DD/MM/YYYY
 * Used for display in tables, reports, and non-input text.
 */
export const STANDARD_DATE_FORMAT = 'dd/MM/yyyy'

/**
 * Input Date Format: YYYY-MM-DD
 * Used for HTML5 <input type="date"> values.
 */
export const INPUT_DATE_FORMAT = 'yyyy-MM-dd'

/**
 * Formats a date string, number, or Date object to DD/MM/YYYY.
 * Returns 'N/A' if the date is invalid.
 * @param date - The date to format
 * @param formatStr - Optional format string (defaults to DD/MM/YYYY)
 */
export const formatDate = (
    date: string | number | Date | null | undefined,
    formatStr: string = STANDARD_DATE_FORMAT
): string => {
    if (!date) return '—'

    const dateObj = new Date(date)
    if (!isValid(dateObj)) return 'Fecha inválida'

    return format(dateObj, formatStr, { locale: es })
}

/**
 * Converts a date to YYYY-MM-DD format for use in HTML inputs.
 * @param date - The date to format
 */
export const toInputDate = (date: string | number | Date | null | undefined): string => {
    if (!date) return ''

    const dateObj = new Date(date)
    if (!isValid(dateObj)) return ''

    return format(dateObj, INPUT_DATE_FORMAT)
}

/**
 * Parses a standard input date string (YYYY-MM-DD) into a Date object.
 * @param dateString - The string from an input
 */
export const parseInputDate = (dateString: string): Date | null => {
    if (!dateString) return null
    const date = parse(dateString, INPUT_DATE_FORMAT, new Date())
    return isValid(date) ? date : null
}

/**
 * Parses a date string in Spanish display format (DD/MM/YYYY or D/M/YYYY) into YYYY-MM-DD.
 * Returns empty string if invalid.
 */
export const parseDisplayDateToInput = (ddMmYyyy: string): string => {
    if (!ddMmYyyy || !ddMmYyyy.trim()) return ''
    const trimmed = ddMmYyyy.trim()
    const formats = [STANDARD_DATE_FORMAT, 'd/M/yyyy', 'dd/M/yyyy', 'd/MM/yyyy']
    for (const fmt of formats) {
        const d = parse(trimmed, fmt, new Date())
        if (isValid(d)) return format(d, INPUT_DATE_FORMAT)
    }
    return ''
}

/**
 * Converts YYYY-MM-DD (internal/value) to DD/MM/YYYY for display in inputs.
 */
export const inputDateToDisplay = (yyyyMmDd: string): string => {
    if (!yyyyMmDd || !yyyyMmDd.trim()) return ''
    const d = parse(yyyyMmDd.trim(), INPUT_DATE_FORMAT, new Date())
    if (!isValid(d)) return ''
    return format(d, STANDARD_DATE_FORMAT)
}

/**
 * Helper specifically for currency/accounting contexts if we need consistent timestamp formatting
 */
export const formatDateTime = (
    date: string | number | Date | null | undefined
): string => {
    return formatDate(date, 'dd/MM/yyyy HH:mm')
}
