import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { JobFormModal } from '@/components/JobFormModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Upload, Play, Eye, Loader2 } from 'lucide-react';
import { jobsApi, matchesApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: string;
  title: string;
  description: string;
  experienceLevel: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  createdAt: string;
}

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningMatch, setRunningMatch] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (id) loadJob(id);
  }, [id]);

  const loadJob = async (jobId: string) => {
    try {
      const response = await jobsApi.getById(jobId);
      // TODO: Map actual API response
      setJob(response.data);
    } catch (error) {
      console.error('Failed to load job:', error);
      setJob({
        id: jobId,
        title: 'Senior Full Stack Developer',
        description: 'We are looking for an experienced full stack developer...',
        experienceLevel: 'Senior',
        requiredSkills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
        niceToHaveSkills: ['AWS', 'Docker', 'Kubernetes'],
        createdAt: '2024-01-15',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRunMatching = async () => {
    if (!id) return;
    setRunningMatch(true);
    try {
      toast({ title: 'Matching started', description: 'AI is analyzing candidates. This may take a few minutes.' });

      const res = await matchesApi.run(id);

      const matches = res?.data?.matches;
      if (Array.isArray(matches)) {
        toast({
          title: 'Matching complete',
          description: `Found ${matches.length} match(es). Redirecting to results...`,
        });
      } else {
        toast({ title: 'Matching queued', description: 'Matching job accepted. Redirecting to results...' });
      }

      navigate(`/matches/${id}`);
      return;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start matching process.',
        variant: 'destructive',
      });
      setRunningMatch(false);
    }
  };

  if (loading || !job) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/jobs')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{job.title}</h1>
          <p className="text-muted-foreground mt-1">
            Created on {new Date(job.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <JobFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          if (id) loadJob(id);
        }}
        job={job}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">
                {job.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((skill, index) => (
                  <Badge key={index} variant="default">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nice to Have Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {job.niceToHaveSkills.map((skill, index) => (
                  <Badge key={index} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() => navigate(`/upload?jobId=${id}`)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Resumes
              </Button>

              <Button className="w-full" onClick={() => setEditOpen(true)}>
                Edit Job
              </Button>

              <Button
                className="w-full"
                variant="secondary"
                onClick={handleRunMatching}
                disabled={runningMatch}
              >
                {runningMatch ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {runningMatch ? 'Running...' : 'Run Matching'}
              </Button>

              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate(`/matches/${id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Matches
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Experience Level</p>
                <Badge variant="secondary" className="mt-1">
                  {job.experienceLevel}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
