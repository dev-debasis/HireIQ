import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { matchesApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface NotesModalProps {
  open: boolean;
  onClose: () => void;
  match: {
    id: string;
    candidateName: string;
    notes: string;
  };
  onSave: (notes: string) => void;
}

export const NotesModal = ({ open, onClose, match, onSave }: NotesModalProps) => {
  const [notes, setNotes] = useState(match.notes);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setNotes(match.notes);
  }, [match.notes]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await matchesApi.updateNotes(match.id, notes);
      toast({
        title: 'Notes saved',
        description: 'Your notes have been updated successfully.',
      });
      onSave(notes);
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notes for {match.candidateName}</DialogTitle>
        </DialogHeader>

        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          placeholder="Add your notes about this candidate..."
          className="resize-none"
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Notes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
