import { POLICIES } from '../guideware/policies.js'

export const breakpointColumns = (breakpoint, policies = POLICIES.widgets) =>
  policies.columns[breakpoint] ?? 1

export const getWidgetSpan = (widgetId, spans, breakpoint, policies = POLICIES.widgets) => {
  const value = spans?.[widgetId]?.[breakpoint]
  const columns = breakpointColumns(breakpoint, policies)
  if (!Number.isInteger(value) || value < 1) return 1
  return Math.min(value, columns)
}

const rowsAreFull = (row, span, columns) =>
  row.reduce((sum, placed) => sum + placed.span, 0) + span <= columns

export const resolveWidgetGrid = (widgetList, spans, breakpoint, policies = POLICIES.widgets) => {
  const columns = breakpointColumns(breakpoint, policies)
  const rows = []
  let row = []
  let used = 0

  for (const widgetId of widgetList) {
    const span = getWidgetSpan(widgetId, spans, breakpoint, policies)
    if (used + span > columns) {
      rows.push(row)
      row = []
      used = 0
    }
    row.push({ widgetId, span })
    used += span
  }
  if (row.length) rows.push(row)
  return rows
}

export const tabPosition = (tabId, tabOrder, policies = POLICIES.tabs) =>
  policies.order.indexOf(tabId)

export const tabDirection = (fromTabId, toTabId, tabOrder, policies = POLICIES.tabs) => {
  const from = tabPosition(fromTabId, tabOrder, policies)
  const to = tabPosition(toTabId, tabOrder, policies)
  return to > from ? 'right' : 'left'
}
