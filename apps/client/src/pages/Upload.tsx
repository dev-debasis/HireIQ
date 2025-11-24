import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { jobsApi, candidatesApi } from '@/services/api';
import type { UploadResult } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { UploadDropzone } from '@/components/UploadDropzone';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Job {
  id: string;
  title: string;
}

interface UploadedCandidate {
  id: string;
  name: string;
  status: 'uploaded' | 'processing' | 'ready' | 'error';
  resumeUrl?: string;
  parsedSkills?: string[];
}

interface CandidateFromServer {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  status?: 'uploaded' | 'processing' | 'ready' | 'error' | string;
  resumeUrl?: string;
  parsedSkills?: string[];
}

export default function Upload() {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState(searchParams.get('jobId') || '');
  const [candidates, setCandidates] = useState<UploadedCandidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [polling, setPolling] = useState(false);
  const [confirmProcessingOpen, setConfirmProcessingOpen] = useState(false);
  const [showUploadErrorsDialog, setShowUploadErrorsDialog] = useState(false);
  const pollRef = useRef<number | null>(null);
  const pollTimeoutRef = useRef<number | null>(null);
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<{
    file: File;
    name: string;
    progress: number;
    status: 'pending' | 'uploading' | 'done' | 'error';
    error?: string;
    attempts?: number;
  }[]>([]);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadCandidates(selectedJobId);
    }
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (pollTimeoutRef.current) {
        window.clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [selectedJobId]);

  const loadJobs = async () => {
    try {
      const response = await jobsApi.getAll();
      const data = Array.isArray(response.data) ? response.data : [];
      const mapped = data.map((j: unknown) => {
        const obj = j as Record<string, unknown>;
        const id = obj._id ?? obj.id ?? '';
        const title = obj.jobTitle ?? obj.title ?? 'Untitled Job';
        return { id: String(id), title: String(title) };
      });
      setJobs(mapped);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setJobs([
        { id: '1', title: 'Senior Full Stack Developer' },
        { id: '2', title: 'Product Manager' },
      ]);
    }
  };

  const loadCandidates = async (jobId: string) => {
    try {
      setCandidatesLoading(true);
      const response = await candidatesApi.getByJob(jobId);
      const data = Array.isArray(response.data) ? response.data : [];
      const mapped = (data as CandidateFromServer[]).map((c) => ({
        id: c._id || c.id || 'unknown',
        name: c.name || c.email || `Candidate ${c._id || c.id}`,
        status: (c.status as UploadedCandidate['status']) || 'uploaded',
        resumeUrl: c.resumeUrl,
        parsedSkills: c.parsedSkills || [],
      }));

      setCandidates(mapped);
      return mapped;
    } catch (error) {
      console.error('Failed to load candidates:', error);
      setCandidates([]);
      return [];
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleFilesUploaded = async (files: File[]) => {
    if (!selectedJobId) {
      toast({
        title: 'No job selected',
        description: 'Please select a job before uploading resumes.',
        variant: 'destructive',
      });
      return;
    }

    const initial = files.map((f) => ({ file: f, name: f.name, progress: 0, status: 'pending' as const, attempts: 0 }));
    setUploadingFiles(initial);

    try {
      const results = await candidatesApi.upload(
        selectedJobId,
        files,
        (index, percent) => {
          setUploadingFiles((prev) => {
            const copy = prev.slice();
            if (!copy[index]) return prev;
            copy[index] = { ...copy[index], progress: percent, status: percent >= 100 ? 'done' : 'uploading' };
            return copy;
          });
        },
        (index, attempt) => {
          setUploadingFiles((prev) => {
            const copy = prev.slice();
            if (!copy[index]) return prev;
            copy[index] = { ...copy[index], attempts: attempt };
            return copy;
          });
        }
      );
      

      setUploadingFiles((prev) =>
        prev.map((u, i) => {
          const r = results[i];
          if (r && 'error' in r) {
            const e = r.error;
            let errMsg = 'Upload failed';
            if (typeof e === 'object' && e !== null && 'message' in e) {
              const m = (e as { message?: unknown }).message;
              if (typeof m === 'string') errMsg = m;
            } else if (typeof e === 'string') {
              errMsg = e;
            }
            return { ...u, status: 'error', error: errMsg, attempts: r.attempts };
          }
          const attempts = (r && 'response' in r) ? r.attempts ?? 1 : 1;
          return { ...u, status: 'done', progress: 100, attempts };
        })
      );

      const successCount = results.filter((r) => !('error' in r)).length;
      toast({
        title: 'Upload complete',
        description: `${successCount} of ${files.length} resume(s) uploaded successfully.`,
      });

      setTimeout(() => loadCandidates(selectedJobId), 800);
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload resumes. Please try again.',
        variant: 'destructive',
      });
      setUploadingFiles((prev) => prev.map((u) => ({ ...u, status: 'error', error: 'Upload failed' })));
    }
  };

  const handleStartProcessing = async () => {
    if (!selectedJobId) return;
    const candidateIds = candidates
      .filter((c) => c.status !== 'ready')
      .map((c) => c.id);

    if (candidateIds.length === 0) {
      toast({
        title: 'Nothing to process',
        description: 'All candidates are already processed.',
      });
      return;
    }

    setProcessing(true);

    try {
      await candidatesApi.process(candidateIds);
      toast({
        title: 'Processing started',
        description: 'Resumes are being processed. This may take a few minutes.',
      });
      loadCandidates(selectedJobId);

      startPolling(selectedJobId);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start processing.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
      setConfirmProcessingOpen(false);
    }
  };

  const retryUpload = async (index: number) => {
    if (!selectedJobId) return;
    const item = uploadingFiles[index];
    if (!item) return;

    setUploadingFiles((prev) => prev.map((u, i) => (i === index ? { ...u, status: 'uploading', progress: 0, error: undefined } : u)));

    try {
      const results = await candidatesApi.upload(
        selectedJobId,
        [item.file],
        (i, percent) => {
          setUploadingFiles((prev) => {
            const copy = prev.slice();
            if (!copy[index]) return prev;
            copy[index] = { ...copy[index], progress: percent, status: percent >= 100 ? 'done' : 'uploading' };
            return copy;
          });
        },
        (i, attempt) => {
          setUploadingFiles((prev) => {
            const copy = prev.slice();
            if (!copy[index]) return prev;
            copy[index] = { ...copy[index], attempts: attempt };
            return copy;
          });
        }
      );
      

      const r = results[0];
      if (r && 'error' in r) {
        const e = r.error;
        let errMsg = 'Upload failed';
        if (typeof e === 'object' && e !== null && 'message' in e) {
          const m = (e as { message?: unknown }).message;
          if (typeof m === 'string') errMsg = m;
        } else if (typeof e === 'string') {
          errMsg = e;
        }
        setUploadingFiles((prev) => prev.map((u, i) => (i === index ? { ...u, status: 'error', error: errMsg } : u)));
      } else if (r && 'response' in r) {
        const attempts = r.attempts ?? 1;
        setUploadingFiles((prev) => prev.map((u, i) => (i === index ? { ...u, status: 'done', progress: 100, attempts } : u)));
        setTimeout(() => loadCandidates(selectedJobId), 800);
      }
    } catch (err) {
      setUploadingFiles((prev) => prev.map((u, i) => (i === index ? { ...u, status: 'error', error: 'Upload failed' } : u)));
    }
  };

  const startPolling = (jobId: string) => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (pollTimeoutRef.current) {
      window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }

    setPolling(true);

    pollRef.current = window.setInterval(async () => {
      try {
        const latest = await loadCandidates(jobId);
        const allReady = latest.length > 0 && latest.every((c) => c.status === 'ready');
        if (allReady) {
          stopPolling();
        }
      } catch (e) {
        // ignore polling errors but keep trying until timeout
      }
    }, 3000);

    pollTimeoutRef.current = window.setTimeout(() => {
      stopPolling();
      toast({
        title: 'Processing may take longer',
        description: 'Processing is still running on the server. Refresh later to see results.',
      });
    }, 2 * 60 * 1000);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (pollTimeoutRef.current) {
      window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    setPolling(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <AlertCircle className="h-4 w-4 animate-pulse" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string): 'secondary' | 'default' | 'outline' | 'destructive' => {
    switch (status) {
      case 'uploaded':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'ready':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Resumes</h1>
        <p className="text-muted-foreground mt-1">
          Upload candidate resumes for AI-powered matching
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Job</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="job-select">Job Position</Label>
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger id="job-select">
              <SelectValue placeholder="Select a job" />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedJobId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
            </CardHeader>
            <CardContent>
              <UploadDropzone onFilesAccepted={handleFilesUploaded} />
            </CardContent>
          </Card>

          {/* show per-file upload progress when uploadingFiles present */}
          {uploadingFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {uploadingFiles.map((f, idx) => (
                    <div key={idx} className="p-3 border border-border rounded-md bg-accent">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{f.name}</div>
                        <div className="text-sm flex items-center gap-2">
                          {f.status === 'uploading' && `${f.progress}%`}
                          {f.status === 'done' && 'Uploaded'}
                          {f.status === 'error' && 'Error'}
                          {f.status === 'error' && (
                            <Button size="sm" variant="ghost" onClick={() => retryUpload(idx)}>
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                      {typeof f.attempts === 'number' && (
                        <div className="text-xs text-muted-foreground mt-1">Attempts: {f.attempts}</div>
                      )}
                      <div className="w-full bg-muted h-2 rounded mt-2 overflow-hidden">
                        <div
                          className="h-2 bg-primary rounded"
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                      {f.error && <div className="text-destructive text-sm mt-1">{f.error}</div>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* show a small errors card if any file failed */}
          {uploadingFiles.some((u) => u.status === 'error') && (
            <div>
              <Button variant="outline" onClick={() => setShowUploadErrorsDialog(true)}>Show Upload Errors</Button>
            </div>
          )}

          {candidatesLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>Loading candidates...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="p-3 border border-border rounded-md bg-accent animate-pulse h-12" />
                  <div className="p-3 border border-border rounded-md bg-accent animate-pulse h-12" />
                  <div className="p-3 border border-border rounded-md bg-accent animate-pulse h-12" />
                </div>
              </CardContent>
            </Card>
          ) : candidates.length > 0 && (
            <>
              <Card className="mb-2">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Processed</div>
                    <div className="font-medium">
                      {candidates.filter((c) => c.status === 'ready').length} / {candidates.length}
                    </div>
                  </div>
                  <div className="w-full bg-muted h-2 rounded mt-2 overflow-hidden">
                    <div
                      className="h-2 bg-primary rounded"
                      style={{ width: `${Math.round((candidates.filter((c) => c.status === 'ready').length / Math.max(1, candidates.length)) * 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Uploaded Candidates ({candidates.length})</CardTitle>
                <Button onClick={() => setConfirmProcessingOpen(true)} disabled={processing}>
                  {processing ? 'Processing...' : 'Start Processing'}
                </Button>
                <Dialog open={confirmProcessingOpen} onOpenChange={setConfirmProcessingOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start Processing</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">Are you sure you want to start processing candidates? This will queue AI parsing.</div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setConfirmProcessingOpen(false)}>Cancel</Button>
                      <Button onClick={() => handleStartProcessing()} disabled={processing}>
                        {processing ? 'Processing...' : 'Confirm'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between p-3 border border-border rounded-md bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {candidate.name}
                        </span>
                      </div>
                      <Badge variant={getStatusColor(candidate.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(candidate.status)}
                          {candidate.status}
                        </span>
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
              </Card>
            </>
          )}
          
          {/* Upload errors dialog */}
          <Dialog open={showUploadErrorsDialog} onOpenChange={setShowUploadErrorsDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Errors</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 py-2">
                {uploadingFiles.map((u, idx) => u.status === 'error' && (
                  <div key={idx} className="p-2 border border-border rounded">
                    <div className="font-medium">{u.name}</div>
                    <div className="text-sm text-destructive">{u.error}</div>
                    <div className="mt-2">
                      <Button size="sm" onClick={() => retryUpload(idx)}>Retry</Button>
                    </div>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowUploadErrorsDialog(false)}>Close</Button>
                <Button onClick={async () => {
                  const failedIndices = uploadingFiles.map((u, i) => u.status === 'error' ? i : -1).filter(i => i >= 0);
                  for (const i of failedIndices) {
                    await retryUpload(i);
                  }
                }}>Retry All</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
