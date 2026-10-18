import { DataError } from './errors'
import type { DataRepository } from './repository'
import type { ListDetails } from './types'

const MAX_EXPORT_BYTES = 4 * 1024 * 1024
const CSV_COLUMNS = [
  'id', 'category_id', 'category', 'title', 'description', 'is_completed',
  'completed_at', 'due_date', 'priority', 'order', 'created_at', 'updated_at',
] as const

function csvCell(value: string | number | boolean | null): string {
  let text = value === null ? '' : String(value)
  // Quoting alone does not prevent spreadsheet formula execution.
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export function serializeListExport(list: ListDetails, format: string, now = new Date()) {
  if (format !== 'json' && format !== 'csv')
    throw new DataError('VALIDATION_ERROR', '僅支援 JSON 或 CSV 格式')

  // Explicit fields keep account, membership and invitation data out of archives.
  const document = {
    schemaVersion: 1,
    exportedAt: now.toISOString(),
    list: {
      id: list.id, title: list.title, description: list.description, coverImage: list.coverImage,
      createdAt: list.createdAt, updatedAt: list.updatedAt,
    },
    categories: list.categories.map((category) => ({
      id: category.id, name: category.name, color: category.color,
      order: category.order, createdAt: category.createdAt,
    })),
    items: list.items.map((item) => ({
      id: item.id, categoryId: item.categoryId, title: item.title, description: item.description,
      isCompleted: item.isCompleted, completedAt: item.completedAt,
      dueDate: item.dueDate, priority: item.priority, order: item.order,
      createdAt: item.createdAt, updatedAt: item.updatedAt,
    })),
  }
  const categories = new Map(document.categories.map((category) => [category.id, category.name]))
  const body = format === 'json'
    ? `${JSON.stringify(document, null, 2)}\n`
    : '\uFEFF' + [
      CSV_COLUMNS.map(csvCell).join(','),
      ...document.items.map((item) => [
        item.id, item.categoryId, categories.get(item.categoryId || '') || '', item.title,
        item.description, item.isCompleted, item.completedAt, item.dueDate, item.priority,
        item.order, item.createdAt, item.updatedAt,
      ].map(csvCell).join(',')),
    ].join('\r\n') + '\r\n'
  if (Buffer.byteLength(body, 'utf8') > MAX_EXPORT_BYTES)
    throw new DataError('VALIDATION_ERROR', '匯出超過 4 MiB 上限，請縮小清單後重試')

  return {
    body,
    contentType: format === 'json' ? 'application/json; charset=utf-8' : 'text/csv; charset=utf-8',
    filename: `bucket-list-${list.id}-${now.toISOString().slice(0, 10)}.${format}`,
  }
}

export async function exportList(
  repository: Pick<DataRepository, 'getList'>,
  userId: string,
  listId: string,
  format: string,
) {
  // getList checks live access and returns one consistent repository snapshot.
  return serializeListExport(await repository.getList(userId, listId), format)
}
