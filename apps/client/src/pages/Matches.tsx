import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, FileText } from 'lucide-react';
import { matchesApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { NotesModal } from '@/components/NotesModal';

interface Match {
  id: string;
  candidateId: string;
  candidateName: string;
  finalScore: number;
  matchedSkills: Array<{ skill: string; evidence: string }>;
  missingSkills: string[];
  shortlisted: boolean;
  notes: string;
}

interface EvidenceSnippet {
  skill: string;
  snippet: string;
}

type CandidateRef = string | { _id?: string; id?: string; name?: string; email?: string };

interface MatchFromServer {
  _id?: string;
  id?: string;
  candidateId?: CandidateRef;
  candidate?: CandidateRef;
  matchedSkills?: string[];
  evidenceSnippets?: EvidenceSnippet[];
  finalScore?: number;
  missingSkills?: string[];
  shortlisted?: boolean;
  notes?: string;
}

export default function Matches() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);

  useEffect(() => {
    if (jobId) loadMatches(jobId);
    else setMatches([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const loadMatches = async (id: string) => {
    setLoading(true);
    try {
      const response = await matchesApi.getByJob(id);
      const data = Array.isArray(response.data) ? response.data : [];

      const mapped = (data as MatchFromServer[]).map((m) => {
        const candidate = (m.candidateId as CandidateRef) || (m.candidate as CandidateRef) || ({} as CandidateRef);
        const matchedSkills = (m.matchedSkills || []).map((skill) => {
          const evidenceObj = (m.evidenceSnippets || []).find((es) => es.skill === skill);
          return { skill, evidence: evidenceObj ? evidenceObj.snippet : '' };
        });

        return {
          id: m._id || m.id || 'unknown',
          candidateId: candidate._id || candidate.id || candidate,
          candidateName: candidate.name || candidate.email || `Candidate ${candidate._id || candidate.id}`,
          finalScore: typeof m.finalScore === 'number' ? m.finalScore : 0,
          matchedSkills,
          missingSkills: m.missingSkills || [],
          shortlisted: m.shortlisted || false,
          notes: m.notes || '',
        };
      });

      setMatches(mapped);
    } catch (error) {
      console.error('Failed to load matches:', error);
      toast({ title: 'Error', description: 'Failed to load matches for this job.', variant: 'destructive' });
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 0.75) return 'bg-green-500';
    if (score > 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleShortlistToggle = async (matchId: string, currentValue: boolean) => {
    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, shortlisted: !currentValue } : m)));

    try {
      const res = await matchesApi.shortlist(matchId);
      const updated = res.data?.match || null;

      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, shortlisted: updated ? updated.shortlisted : !currentValue } : m))
      );

      toast({
        title: 'Updated',
        description: `Candidate ${!currentValue ? 'added to' : 'removed from'} shortlist.`,
      });
    } catch (error) {
      setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, shortlisted: currentValue } : m)));
      toast({
        title: 'Error',
        description: 'Failed to update shortlist status.',
        variant: 'destructive',
      });
    }
  };

  const handleNotesClick = (match: Match) => {
    setSelectedMatch(match);
    setNotesModalOpen(true);
  };

  const handleNotesSaved = (notes: string) => {
    const matchId = selectedMatch?.id;
    if (!matchId) return;

    (async () => {
      try {
        const res = await matchesApi.updateNotes(matchId, notes);
        const updated = res.data?.match || null;
        setMatches(
          matches.map((m) => (m.id === matchId ? { ...m, notes: updated ? updated.notes : notes } : m))
        );
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to save notes.', variant: 'destructive' });
      } finally {
        setNotesModalOpen(false);
      }
    })();
  };

  if (!jobId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Match Results</h1>
          <p className="text-muted-foreground mt-1">No job selected. Go to Jobs and select a job to view matches.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div>Loading matches...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(jobId ? `/jobs/${jobId}` : '/jobs')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Match Results</h1>
          <p className="text-muted-foreground mt-1">
            {matches.length} candidates analyzed
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidates</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate Name</TableHead>
                <TableHead>Match Score</TableHead>
                <TableHead>Matched Skills</TableHead>
                <TableHead>Missing Skills</TableHead>
                <TableHead>Shortlist</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {match.candidateName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getScoreColor(match.finalScore)} text-primary-foreground`}
                    >
                      {(match.finalScore * 100).toFixed(0)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="skills" className="border-0">
                        <AccordionTrigger className="py-0 hover:no-underline">
                          <div className="flex flex-wrap gap-1">
                            {match.matchedSkills.slice(0, 3).map((ms, idx) => (
                              <Badge key={idx} variant="default" className="text-xs">
                                {ms.skill}
                              </Badge>
                            ))}
                            {match.matchedSkills.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{match.matchedSkills.length - 3}
                              </Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {match.matchedSkills.map((ms, idx) => (
                              <div key={idx} className="text-sm">
                                <p className="font-medium text-foreground">{ms.skill}</p>
                                <p className="text-muted-foreground">{ms.evidence}</p>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {match.missingSkills.map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={match.shortlisted}
                      onCheckedChange={() =>
                        handleShortlistToggle(match.id, match.shortlisted)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNotesClick(match)}
                    >
                      {match.notes ? 'Edit' : 'Add'} Notes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedMatch && (
        <NotesModal
          open={notesModalOpen}
          onClose={() => setNotesModalOpen(false)}
          match={selectedMatch}
          onSave={handleNotesSaved}
        />
      )}
    </div>
  );
}
