import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { jobsApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface JobFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  job?: {
    id: string;
    title: string;
    description: string;
    experienceLevel: string;
    requiredSkills: string[];
    niceToHaveSkills: string[];
  } | null;
}

export const JobFormModal = ({ open, onClose, onSuccess, job = null }: JobFormModalProps) => {
  const isEdit = Boolean(job);

  const [formData, setFormData] = useState({
    title: job?.title || '',
    description: job?.description || '',
    experienceLevel: job?.experienceLevel || 'Any',
    requiredSkills: job?.requiredSkills || [] as string[],
    niceToHaveSkills: job?.niceToHaveSkills || [] as string[],
  });

  useEffect(() => {
    setFormData({
      title: job?.title || '',
      description: job?.description || '',
      experienceLevel: job?.experienceLevel || 'Any',
      requiredSkills: job?.requiredSkills || [],
      niceToHaveSkills: job?.niceToHaveSkills || [],
    });
  }, [job, open]);
  const [skillInput, setSkillInput] = useState('');
  const [niceToHaveInput, setNiceToHaveInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddSkill = (type: 'required' | 'niceToHave') => {
    const input = type === 'required' ? skillInput : niceToHaveInput;
    if (!input.trim()) return;

    if (type === 'required') {
      setFormData({
        ...formData,
        requiredSkills: [...formData.requiredSkills, input.trim()],
      });
      setSkillInput('');
    } else {
      setFormData({
        ...formData,
        niceToHaveSkills: [...formData.niceToHaveSkills, input.trim()],
      });
      setNiceToHaveInput('');
    }
  };

  const handleRemoveSkill = (type: 'required' | 'niceToHave', index: number) => {
    if (type === 'required') {
      setFormData({
        ...formData,
        requiredSkills: formData.requiredSkills.filter((_, i) => i !== index),
      });
    } else {
      setFormData({
        ...formData,
        niceToHaveSkills: formData.niceToHaveSkills.filter((_, i) => i !== index),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        jobTitle: formData.title,
        jobDescription: formData.description,
        requiredSkills: formData.requiredSkills,
        niceToHaveSkills: formData.niceToHaveSkills,
        experienceLevel: formData.experienceLevel,
      };

      if (isEdit && job?.id) {
        await jobsApi.update(job.id, payload);
      } else {
        await jobsApi.create(payload);
      }
      onSuccess();
      setFormData({
        title: '',
        description: '',
        experienceLevel: 'Any',
        requiredSkills: [],
        niceToHaveSkills: [],
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create job. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Job' : 'Create New Job'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              placeholder="e.g., Senior Full Stack Developer"
            />
          </div>

          <div>
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              rows={5}
              placeholder="Describe the role, responsibilities, and requirements..."
            />
          </div>

          <div>
            <Label htmlFor="experienceLevel">Experience Level</Label>
            <Select
              value={formData.experienceLevel}
              onValueChange={(value) =>
                setFormData({ ...formData, experienceLevel: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Any">Any</SelectItem>
                <SelectItem value="Junior">Junior</SelectItem>
                <SelectItem value="Mid">Mid</SelectItem>
                <SelectItem value="Senior">Senior</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="requiredSkills">Required Skills</Label>
            <div className="flex gap-2">
              <Input
                id="requiredSkills"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Type a skill and press Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill('required');
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleAddSkill('required')}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.requiredSkills.map((skill, index) => (
                <Badge key={index} variant="default">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill('required', index)}
                    className="ml-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="niceToHaveSkills">Nice to Have Skills</Label>
            <div className="flex gap-2">
              <Input
                id="niceToHaveSkills"
                value={niceToHaveInput}
                onChange={(e) => setNiceToHaveInput(e.target.value)}
                placeholder="Type a skill and press Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill('niceToHave');
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleAddSkill('niceToHave')}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.niceToHaveSkills.map((skill, index) => (
                <Badge key={index} variant="outline">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill('niceToHave', index)}
                    className="ml-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (isEdit ? 'Saving...' : 'Creating...') : isEdit ? 'Save Changes' : 'Create Job'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
