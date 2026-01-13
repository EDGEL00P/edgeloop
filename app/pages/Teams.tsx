'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNflTeams, usePlayers, useTeamAnalysis } from '@/lib/api';
import { useSettings } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  Users, 
  TrendingUp,
  Award,
  Swords,
  Shield,
  MapPin,
  Eye,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamStanding {
  wins: number;
  losses: number;
  ties: number;
  divisionRank: number;
  playoffStatus: 'clinched' | 'in-hunt' | 'eliminated';
  pointsFor: number;
  pointsAgainst: number;
  streak: string;
}

interface MockPlayer {
  id: number;
  name: string;
  position: string;
  rating: number;
}

const generateMockStandings = (teamId: number): TeamStanding => {
  const seed = teamId * 13;
  const wins = Math.floor((seed % 12) + 4);
  const losses = 17 - wins;
  const divisionRank = ((seed % 4) + 1);
  const playoffStatus = wins >= 10 ? 'clinched' : wins >= 7 ? 'in-hunt' : 'eliminated';
  
  return {
    wins,
    losses,
    ties: 0,
    divisionRank,
    playoffStatus,
    pointsFor: 300 + (seed % 150),
    pointsAgainst: 280 + ((seed * 7) % 160),
    streak: seed % 3 === 0 ? 'W3' : seed % 5 === 0 ? 'L2' : 'W1',
  };
};

const generateMockRoster = (teamId: number): MockPlayer[] => {
  const positions = ['QB', 'RB', 'WR', 'TE', 'DE'];
  const names = [
    ['Marcus', 'Williams'], ['Derrick', 'Johnson'], ['Tyreek', 'Smith'],
    ['George', 'Taylor'], ['Aaron', 'Davis']
  ];
  
  return positions.map((pos, i) => ({
    id: teamId * 100 + i,
    name: `${names[i][0]} ${names[i][1]}`,
    position: pos,
    rating: 75 + ((teamId + i) % 20),
  }));
};

const TEAM_COLORS: Record<string, string> = {
  'BUF': '#00338D', 'MIA': '#008E97', 'NE': '#002244', 'NYJ': '#125740',
  'BAL': '#241773', 'CIN': '#FB4F14', 'CLE': '#311D00', 'PIT': '#FFB612',
  'HOU': '#03202F', 'IND': '#002C5F', 'JAX': '#006778', 'TEN': '#4B92DB',
  'DEN': '#FB4F14', 'KC': '#E31837', 'LV': '#000000', 'LAC': '#0080C6',
  'DAL': '#003594', 'NYG': '#0B2265', 'PHI': '#004C54', 'WSH': '#5A1414',
  'CHI': '#0B162A', 'DET': '#0076B6', 'GB': '#203731', 'MIN': '#4F2683',
  'ATL': '#A71930', 'CAR': '#0085CA', 'NO': '#D3BC8D', 'TB': '#D50A0A',
  'ARI': '#97233F', 'LAR': '#003594', 'SF': '#AA0000', 'SEA': '#002244',
};

const DIVISIONS = ['East', 'North', 'South', 'West'];

export default function Teams() {
  const { reduceMotion } = useSettings();
  const { data: teams = [], isLoading } = useNflTeams();
  const teamAnalysis = useTeamAnalysis();
  
  const [conferenceFilter, setConferenceFilter] = useState<string>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<typeof teams[0] | null>(null);
  const [opponentTeam, setOpponentTeam] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTeam) {
      setAiAnalysis(null);
      const standing = generateMockStandings(selectedTeam.id);
      teamAnalysis.mutate({
        teamName: selectedTeam.fullName,
        conference: selectedTeam.conference,
        division: selectedTeam.division,
        wins: standing.wins,
        losses: standing.losses,
        pointsFor: standing.pointsFor,
        pointsAgainst: standing.pointsAgainst,
        streak: standing.streak,
        playoffStatus: standing.playoffStatus,
      }, {
        onSuccess: (data) => setAiAnalysis(data.analysis),
      });
    }
  }, [selectedTeam]);

  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      if (conferenceFilter !== 'all' && team.conference !== conferenceFilter) return false;
      if (divisionFilter !== 'all' && team.division !== divisionFilter) return false;
      return true;
    });
  }, [teams, conferenceFilter, divisionFilter]);

  const groupedTeams = useMemo(() => {
    const grouped: Record<string, Record<string, typeof teams>> = {
      AFC: { East: [], North: [], South: [], West: [] },
      NFC: { East: [], North: [], South: [], West: [] },
    };
    
    filteredTeams.forEach(team => {
      if (grouped[team.conference] && grouped[team.conference][team.division]) {
        grouped[team.conference][team.division].push(team);
      }
    });

    Object.keys(grouped).forEach(conf => {
      Object.keys(grouped[conf]).forEach(div => {
        grouped[conf][div].sort((a, b) => {
          const aStanding = generateMockStandings(a.id);
          const bStanding = generateMockStandings(b.id);
          return aStanding.divisionRank - bStanding.divisionRank;
        });
      });
    });
    
    return grouped;
  }, [filteredTeams]);

  const getPlayoffStatusColor = (status: string) => {
    switch (status) {
      case 'clinched': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in-hunt': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'eliminated': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return '';
    }
  };

  const getHeadToHead = (team1Id: number, team2Id: number) => {
    const seed = (team1Id * team2Id) % 7;
    const wins = seed % 3;
    const losses = 2 - wins;
    return { wins, losses };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#CD1141] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading teams...</p>
        </div>
      </div>
    );
  }

  const conferencesToShow = conferenceFilter === 'all' ? ['AFC', 'NFC'] : [conferenceFilter];
  const divisionsToShow = divisionFilter === 'all' ? DIVISIONS : [divisionFilter];

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6"
        >
          <h1 className="font-display text-3xl tracking-wider mb-2" style={{ textShadow: '0 0 20px rgba(205, 17, 65, 0.5)' }}>
            NFL TEAM DIRECTORY
          </h1>
          <p className="text-muted-foreground text-sm">
            Browse teams by conference and division with standings and detailed analytics
          </p>
        </motion.div>

        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Conference:</span>
            <Select value={conferenceFilter} onValueChange={setConferenceFilter}>
              <SelectTrigger className="w-[140px] bg-card border-border" data-testid="select-conference-filter">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="AFC">AFC</SelectItem>
                <SelectItem value="NFC">NFC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Division:</span>
            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger className="w-[140px] bg-card border-border" data-testid="select-division-filter">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="East">East</SelectItem>
                <SelectItem value="North">North</SelectItem>
                <SelectItem value="South">South</SelectItem>
                <SelectItem value="West">West</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {conferencesToShow.map(conference => (
          <div key={conference} className="space-y-6">
            <div className="flex items-center gap-3">
              <Badge 
                className={cn(
                  "text-lg px-4 py-1",
                  conference === 'AFC' ? 'bg-[#CD1141] text-white' : 'bg-blue-600 text-white'
                )}
              >
                {conference}
              </Badge>
              <Separator className="flex-1" />
            </div>

            {divisionsToShow.map(division => {
              const divisionTeams = groupedTeams[conference]?.[division] || [];
              if (divisionTeams.length === 0) return null;

              return (
                <div key={`${conference}-${division}`} className="space-y-4">
                  <h3 className="font-display text-lg text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {conference} {division}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {divisionTeams.map((team, index) => {
                      const standing = generateMockStandings(team.id);
                      const teamColor = TEAM_COLORS[team.abbreviation] || '#CD1141';
                      
                      return (
                        <motion.div
                          key={team.id}
                          initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="glass rounded-xl p-4 border border-border/50 hover:border-[#CD1141]/50 transition-all relative overflow-hidden group"
                          data-testid={`team-card-${team.id}`}
                        >
                          <div 
                            className="absolute top-0 left-0 w-1 h-full"
                            style={{ backgroundColor: teamColor }}
                          />
                          
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center font-display text-xs font-bold"
                                style={{ backgroundColor: teamColor + '30', color: teamColor }}
                              >
                                {team.abbreviation}
                              </div>
                              <div>
                                <div className="font-display text-sm">{team.name}</div>
                                <div className="text-xs text-muted-foreground">{team.location}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs font-mono">#{standing.divisionRank}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-xs">
                              {team.conference}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {team.division}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between mb-3">
                            <div className="text-center">
                              <div className="font-display text-xl">
                                {standing.wins}-{standing.losses}
                              </div>
                              <div className="text-xs text-muted-foreground">Record</div>
                            </div>
                            <div className="text-center">
                              <Badge className={cn("text-xs", getPlayoffStatusColor(standing.playoffStatus))}>
                                {standing.playoffStatus === 'clinched' && <Award className="w-3 h-3 mr-1" />}
                                {standing.playoffStatus.charAt(0).toUpperCase() + standing.playoffStatus.slice(1).replace('-', ' ')}
                              </Badge>
                            </div>
                            <div className="text-center">
                              <div className={cn(
                                "font-mono text-sm",
                                standing.streak.startsWith('W') ? 'text-green-400' : 'text-red-400'
                              )}>
                                {standing.streak}
                              </div>
                              <div className="text-xs text-muted-foreground">Streak</div>
                            </div>
                          </div>

                          <div className="flex gap-2 text-xs text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <Swords className="w-3 h-3 text-green-400" />
                              <span>PF: {standing.pointsFor}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-red-400" />
                              <span>PA: {standing.pointsAgainst}</span>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full min-h-[44px] border-[#CD1141]/30 hover:bg-[#CD1141]/10 hover:border-[#CD1141] touch-manipulation"
                            onClick={() => setSelectedTeam(team)}
                            data-testid={`button-view-team-${team.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <Dialog open={!!selectedTeam} onOpenChange={() => { setSelectedTeam(null); setOpponentTeam(''); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border" data-testid="modal-team-detail">
            {selectedTeam && (() => {
              const standing = generateMockStandings(selectedTeam.id);
              const roster = generateMockRoster(selectedTeam.id);
              const teamColor = TEAM_COLORS[selectedTeam.abbreviation] || '#CD1141';
              const h2h = opponentTeam ? getHeadToHead(selectedTeam.id, parseInt(opponentTeam)) : null;
              
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-display text-sm font-bold"
                        style={{ backgroundColor: teamColor + '30', color: teamColor }}
                      >
                        {selectedTeam.abbreviation}
                      </div>
                      <div>
                        <div className="text-xl">{selectedTeam.fullName}</div>
                        <div className="text-sm text-muted-foreground font-normal">
                          {selectedTeam.conference} {selectedTeam.division}
                        </div>
                      </div>
                    </DialogTitle>
                    <DialogDescription>
                      Full team information and season statistics
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <div className="text-2xl font-display">{standing.wins}-{standing.losses}</div>
                        <div className="text-xs text-muted-foreground">Season Record</div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <div className="text-2xl font-display">#{standing.divisionRank}</div>
                        <div className="text-xs text-muted-foreground">Division Rank</div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <div className="text-2xl font-display text-green-400">{standing.pointsFor}</div>
                        <div className="text-xs text-muted-foreground">Points For</div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <div className="text-2xl font-display text-red-400">{standing.pointsAgainst}</div>
                        <div className="text-xs text-muted-foreground">Points Against</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={cn("px-3 py-1", getPlayoffStatusColor(standing.playoffStatus))}>
                        {standing.playoffStatus === 'clinched' && <Award className="w-4 h-4 mr-1" />}
                        {standing.playoffStatus === 'clinched' ? 'Playoff Clinched' : 
                         standing.playoffStatus === 'in-hunt' ? 'In Playoff Hunt' : 'Eliminated'}
                      </Badge>
                      <Badge variant="outline" className={cn(
                        standing.streak.startsWith('W') ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'
                      )}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Current Streak: {standing.streak}
                      </Badge>
                    </div>

                    {(aiAnalysis || teamAnalysis.isPending) && (
                      <div className="bg-[#CD1141]/5 border border-[#CD1141]/20 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-[#CD1141]/10">
                            <Brain className="w-4 h-4 text-[#CD1141]" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-display text-sm text-[#CD1141]">AI Team Analysis</span>
                              {teamAnalysis.isPending && (
                                <div className="w-3 h-3 border-2 border-[#CD1141]/30 border-t-[#CD1141] rounded-full animate-spin" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {aiAnalysis || "Analyzing team performance and betting trends..."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div>
                      <h4 className="font-display text-sm mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Top 5 Roster Preview
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {roster.map(player => (
                          <div 
                            key={player.id}
                            className="flex items-center justify-between bg-muted/20 rounded-lg p-2 border border-border/30"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs w-10 justify-center">
                                {player.position}
                              </Badge>
                              <span className="text-sm">{player.name}</span>
                            </div>
                            <span className={cn(
                              "text-xs font-mono",
                              player.rating >= 85 ? 'text-green-400' : 
                              player.rating >= 75 ? 'text-yellow-400' : 'text-muted-foreground'
                            )}>
                              {player.rating} OVR
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-display text-sm mb-3 flex items-center gap-2">
                        <Swords className="w-4 h-4" />
                        Head-to-Head Matchup Lookup
                      </h4>
                      <div className="flex items-center gap-4">
                        <Select value={opponentTeam} onValueChange={setOpponentTeam}>
                          <SelectTrigger className="w-[200px] bg-muted/30">
                            <SelectValue placeholder="Select opponent..." />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.filter(t => t.id !== selectedTeam.id).map(team => (
                              <SelectItem key={team.id} value={team.id.toString()}>
                                {team.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {h2h && (
                          <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-4 py-2">
                            <span className="text-sm text-muted-foreground">All-Time Record:</span>
                            <span className={cn(
                              "font-display text-lg",
                              h2h.wins > h2h.losses ? 'text-green-400' : 
                              h2h.wins < h2h.losses ? 'text-red-400' : 'text-yellow-400'
                            )}>
                              {h2h.wins}-{h2h.losses}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
