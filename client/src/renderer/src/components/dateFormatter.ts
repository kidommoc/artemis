function formatMonth(m: number): string {
    const monthMap = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    return monthMap[m]
}

function formatDay(d: number): string {
    const daySubfix = (() => {
        if (Math.floor(d / 10) == 1)
            return 'th'
        switch (d % 10) {
            case 1:
                return 'st'
            case 2:
                return 'nd'
            case 3:
                return 'rd'
            default:
                return 'th'
        }
    })()
    return d + daySubfix
}

export function formatTime(h: number, m: number): string {
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = (() => {
        h %= 12
        h = h == 0 ? 12 : h
        return h < 10 ? '0' + h : '' + h
    })()
    const minute = m < 10 ? '0' + m : '' + m
    return `${hour}:${minute} ${ampm}`
}

export function formatDate(date: Date, withYear?: boolean): string {
    const month = formatMonth(date.getMonth())
    const day = formatDay(date.getDate())
    return (() => {
        const other = `${month} ${day}`
        if (withYear)
            return other + `, ${date.getFullYear()}`
        return other
    })()
}

export function formatDateTime(date: Date, withYear?: boolean): string {
    const dateString = formatDate(date, withYear)
    const timeString = formatTime(date.getHours(), date.getMinutes())
    return `${timeString}, ${dateString}`
}