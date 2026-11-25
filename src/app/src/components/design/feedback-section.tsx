import { useState } from 'react'
import { GallerySection, Specimen } from '#/components/design/gallery-section'
import { FormAlert } from '#/components/forms/form-field'
import { ConfirmDialog } from '#/components/feedback/confirm-dialog'
import { Button } from '#/components/ui/button'
import { useToast } from '#/hooks/app/use-toast'

export function FeedbackSection() {
  const toast = useToast()
  const [dialog, setDialog] = useState<'destructive' | 'default' | null>(null)
  return (
    <GallerySection id="feedback" title="Feedback">
      <Specimen name="FormAlert" source="forms/form-field.tsx">
        <div className="flex w-full max-w-lg flex-col gap-2">
          <FormAlert>The change was not saved.</FormAlert>
          <FormAlert tone="warning">3 transactions need a look.</FormAlert>
          <FormAlert tone="success">Saved.</FormAlert>
          <FormAlert tone="help">
            What a setting does, at the top of its sheet.
          </FormAlert>
          <FormAlert tone="warning" size="tag">
            3 lines already in, skipped
          </FormAlert>
        </div>
      </Specimen>
      <Specimen name="Toast" source="feedback/toaster.tsx">
        <Button
          variant="outline"
          onClick={() => toast({ text: 'A reason, or a note.' })}
        >
          Neutral
        </Button>
        <Button
          variant="outline"
          onClick={() => toast({ text: 'Saved.', tone: 'success' })}
        >
          Success
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast({ text: 'The change was not saved.', tone: 'error' })
          }
        >
          Error
        </Button>
      </Specimen>
      <Specimen name="ConfirmDialog" source="feedback/confirm-dialog.tsx">
        <Button variant="outline" onClick={() => setDialog('destructive')}>
          Destructive
        </Button>
        <Button variant="outline" onClick={() => setDialog('default')}>
          Default
        </Button>
      </Specimen>
      <ConfirmDialog
        open={dialog !== null}
        title={
          dialog === 'destructive' ? 'Delete Chequing' : 'Archive Chequing?'
        }
        tone={dialog ?? 'default'}
        confirmLabel={dialog === 'destructive' ? 'Delete' : 'Archive'}
        description="Its transactions stay."
        onCancel={() => setDialog(null)}
        onConfirm={() => setDialog(null)}
      />
    </GallerySection>
  )
}
