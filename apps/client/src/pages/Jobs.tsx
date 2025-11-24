import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Trash2, Edit } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { jobsApi } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { JobFormModal } from '@/components/JobFormModal';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: string;
  title: string;
  experienceLevel: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  createdAt: string;
}

interface JobFromServer {
  _id?: string;
  id?: string;
  jobTitle?: string;
  title?: string;
  job_title?: string;
  experienceLevel?: string;
  experience_level?: string;
  requiredSkills?: string[];
  required_skills?: string[];
  niceToHaveSkills?: string[];
  nice_to_have_skills?: string[];
  createdAt?: string;
  created_at?: string;
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const response = await jobsApi.getAll();
      const data = response.data;
      const mapped = (Array.isArray(data) ? data : []).map((j: JobFromServer) => ({
        id: j._id || j.id || 'unknown',
        title: j.jobTitle || j.title || j.job_title || '',
        experienceLevel: j.experienceLevel || j.experience_level || 'Any',
        requiredSkills: j.requiredSkills || j.required_skills || [],
        niceToHaveSkills: j.niceToHaveSkills || j.nice_to_have_skills || [],
        createdAt: j.createdAt || j.created_at || new Date().toISOString(),
      }));

      setJobs(mapped);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setJobs([
        {
          id: '1',
          title: 'Senior Full Stack Developer',
          experienceLevel: 'Senior',
          requiredSkills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
          niceToHaveSkills: ['AWS', 'Docker'],
          createdAt: '2024-01-15',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      await jobsApi.delete(id);
      toast({
        title: 'Job deleted',
        description: 'The job has been removed successfully.',
      });
      loadJobs();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete job. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleJobCreated = () => {
    setIsModalOpen(false);
    setEditingJob(null);
    loadJobs();
    toast({
      title: 'Job created',
      description: 'New job has been added successfully.',
    });
  };

  const openEditModal = (job: Job) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Jobs</h1>
          <p className="text-muted-foreground mt-1">
            Manage your job postings and requirements
          </p>
        </div>
        <Button onClick={() => { setEditingJob(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Job
        </Button>
      </div>

      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Title</TableHead>
              <TableHead>Experience Level</TableHead>
              <TableHead>Skills Count</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.title}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{job.experienceLevel}</Badge>
                </TableCell>
                <TableCell>{job.requiredSkills.length} required</TableCell>
                <TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(job)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(job.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <JobFormModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingJob(null);
        }}
        onSuccess={handleJobCreated}
        job={editingJob}
      />
    </div>
  );
}
