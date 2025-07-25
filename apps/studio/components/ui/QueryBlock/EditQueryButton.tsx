import { Edit } from 'lucide-react'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { useIsInlineEditorEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { DiffType } from 'components/interfaces/SQLEditor/SQLEditor.types'
import useNewQuery from 'components/interfaces/SQLEditor/hooks'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import Link from 'next/link'
import { ComponentProps } from 'react'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useAppStateSnapshot } from 'state/app-state'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TooltipContent,
} from 'ui'
import { ButtonTooltip } from '../ButtonTooltip'

interface EditQueryButtonProps {
  id?: string
  title: string
  sql?: string
  className?: string
  type?: 'default' | 'text'
}

export const EditQueryButton = ({
  id,
  sql,
  title,
  className,
  type = 'text',
}: EditQueryButtonProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const { newQuery } = useNewQuery()

  const sqlEditorSnap = useSqlEditorV2StateSnapshot()
  const { setEditorPanel } = useAppStateSnapshot()
  const snap = useAiAssistantStateSnapshot()

  const isInSQLEditor = router.pathname.includes('/sql')
  const isInNewSnippet = router.pathname.endsWith('/sql')
  const isInlineEditorEnabled = useIsInlineEditorEnabled()
  const tooltip: { content: ComponentProps<typeof TooltipContent> & { text: string } } = {
    content: { side: 'bottom', text: 'Edit in SQL Editor' },
  }

  const org = useSelectedOrganization()
  const { mutate: sendEvent } = useSendEventMutation()

  if (id !== undefined) {
    return (
      <ButtonTooltip
        asChild
        type={type}
        size="tiny"
        className={cn('w-7 h-7', className)}
        icon={<Edit size={14} strokeWidth={1.5} />}
        tooltip={tooltip}
      >
        <Link href={`/project/${ref}/sql/${id}`} />
      </ButtonTooltip>
    )
  }

  return !isInSQLEditor || isInNewSnippet ? (
    <ButtonTooltip
      type={type}
      size="tiny"
      className={cn('w-7 h-7', className)}
      icon={<Edit size={14} strokeWidth={1.5} />}
      onClick={() => {
        if (isInlineEditorEnabled) {
          setEditorPanel({
            open: true,
            initialValue: sql,
          })
          snap.closeAssistant()
        } else {
          if (sql) newQuery(sql, title)
        }
        sendEvent({
          action: 'assistant_edit_in_sql_editor_clicked',
          properties: {
            isInSQLEditor,
            isInNewSnippet,
          },
          groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
        })
      }}
      tooltip={tooltip}
    />
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ButtonTooltip
          type={type}
          size="tiny"
          disabled={!sql}
          className={cn('w-7 h-7', className)}
          icon={<Edit size={14} strokeWidth={1.5} />}
          tooltip={!!sql ? tooltip : { content: { side: 'bottom', text: undefined } }}
        />
      </DropdownMenuTrigger>
      {!!sql && (
        <DropdownMenuContent className="w-36">
          <DropdownMenuItem onClick={() => sqlEditorSnap.setDiffContent(sql, DiffType.Addition)}>
            Insert code
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => sqlEditorSnap.setDiffContent(sql, DiffType.Modification)}
          >
            Replace code
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => newQuery(sql, title)}>
            Create new snippet
          </DropdownMenuItem>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  )
}
