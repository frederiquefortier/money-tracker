import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import type { IconName } from '#/components/display/icon'
import { IconBubble } from '#/components/display/icon-bubble'
import { IconButton } from '#/components/display/icon-button'
import { Tag } from '#/components/display/tag'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { cardSurface, focusRing } from '#/components/styles'
import { IMPORT_FILES } from '#/lib/import/import'
import type { ImportFileName } from '#/lib/import/import'
import type { ImportFileRead } from '#/lib/import/import-files'
import { templateHref } from '#/lib/import/import-templates'
import { cn } from '#/lib/utils'
import { Spinner } from '#/components/feedback/spinner'

export const FILE_ICON: Record<ImportFileName, IconName> = {
  accounts: 'wallet',
  transactions: 'receipt',
  splits: 'split',
  people: 'users',
  aliases: 'tags',
}

function FileRow({
  file,
  onRemove,
}: {
  file: ImportFileRead
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const name = `${file.name}.csv`
  return (
    <li className="flex items-center gap-3 py-2.5 pr-2 pl-3">
      <IconBubble icon={FILE_ICON[file.name]} className="size-10" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">{name}</span>
        <span className="text-sm text-muted-foreground">
          {t('import.rows', { count: file.rows.length })}
        </span>
      </div>
      {file.errors.length > 0 && (
        <Tag className="bg-destructive/10 text-destructive">
          {t('import.errorsTitle', { count: file.errors.length })}
        </Tag>
      )}
      <IconButton
        icon="close"
        label={t('common.removeName', { name })}
        onClick={onRemove}
      />
    </li>
  )
}

function TemplatesMenu() {
  const { t } = useTranslation()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {t('import.templates')}
          <Icon name="chevron-down" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {IMPORT_FILES.map((name) => (
          <DropdownMenuItem key={name} asChild>
            <a href={templateHref(name)} download={`${name}.csv`}>
              <Icon name={FILE_ICON[name]} className="size-4" />
              {`${name}.csv`}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DropArea({ onChoose }: { onChoose: () => void }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onChoose}
      className={cn(
        'flex flex-col items-center gap-3 rounded-field border-2 border-dashed border-input px-4 py-8 transition-colors duration-200 hover:bg-secondary/40',
        focusRing,
      )}
    >
      <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
        <Icon name="import" className="size-6" />
      </span>
      <span className="text-center text-muted-foreground">
        {t('import.drop')}{' '}
        <span className="underline underline-offset-4">
          {t('import.chooseLink')}
        </span>
      </span>
    </button>
  )
}

/**
 * Step 1: the files, dropped or chosen, then Téléverser, always there and off
 * until there is something to send. The check runs when it is pressed.
 */
export function ImportFilesCard({
  files,
  uploading,
  canUpload,
  onPick,
  onRemove,
  onUpload,
}: {
  files: ReadonlyArray<ImportFileRead>
  uploading: boolean
  canUpload: boolean
  onPick: (files: ReadonlyArray<File>) => void
  onRemove: (name: ImportFileName) => void
  onUpload: () => void
}) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  return (
    <section
      className={cn(cardSurface, 'flex flex-col')}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        onPick([...event.dataTransfer.files])
      }}
    >
      <input
        ref={input}
        type="file"
        accept=".csv,text/csv"
        multiple
        hidden
        onChange={(event) => {
          onPick([...(event.target.files ?? [])])
          event.target.value = ''
        }}
      />
      <div className="flex flex-col gap-4 p-4">
        <DropArea onChoose={() => input.current?.click()} />
        {files.length > 0 && (
          <ul className="divide-y rounded-field border">
            {files.map((file) => (
              <FileRow
                key={file.name}
                file={file}
                onRemove={() => onRemove(file.name)}
              />
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t p-4">
        <TemplatesMenu />
        <Button disabled={uploading || !canUpload} onClick={onUpload}>
          {uploading && <Spinner />}
          {t('import.upload')}
        </Button>
      </div>
    </section>
  )
}
