import { storage } from "../storage";
import { CacheService, CacheKeys, CacheTTL } from "../infrastructure/cache";
import { logger } from "../infrastructure/logger";

export type MediaType = 'radio' | 'tv' | 'podcast' | 'stream';

export interface MediaLink {
  id: string;
  type: MediaType;
  name: string;
  description: string;
  url: string;
  icon: string;
  isLive: boolean;
  network?: string;
}

export interface GameMediaLinks {
  gameId: number;
  homeTeam: string;
  awayTeam: string;
  gameDate: string;
  radioStreams: MediaLink[];
  tvBroadcasts: MediaLink[];
  podcasts: MediaLink[];
  officialStreams: MediaLink[];
}

const NFL_TEAM_RADIO: Record<string, { name: string; url: string }> = {
  "ARI": { name: "Arizona Sports 98.7 FM", url: "https://www.azsports.com/listen-live/" },
  "ATL": { name: "92.9 The Game", url: "https://929thegame.radio.com/" },
  "BAL": { name: "98 Rock Baltimore", url: "https://www.98online.com/" },
  "BUF": { name: "WGR 550", url: "https://wgr550.radio.com/" },
  "CAR": { name: "WBT 1110 AM", url: "https://www.wbt.com/" },
  "CHI": { name: "WBBM 780 AM", url: "https://www.audacy.com/wbbm780" },
  "CIN": { name: "700 WLW", url: "https://700wlw.iheart.com/" },
  "CLE": { name: "ESPN Cleveland 850", url: "https://www.espncleveland.com/" },
  "DAL": { name: "105.3 The Fan", url: "https://1053thefan.radio.com/" },
  "DEN": { name: "KOA 850 AM", url: "https://www.850koa.com/" },
  "DET": { name: "97.1 The Ticket", url: "https://971theticket.radio.com/" },
  "GB": { name: "WTMJ 620 AM", url: "https://www.tmj4.com/wtmj" },
  "HOU": { name: "SportsRadio 610", url: "https://www.sportsradio610.com/" },
  "IND": { name: "1070 The Fan", url: "https://1070thefan.radio.com/" },
  "JAX": { name: "1010XL", url: "https://1010xl.com/" },
  "KC": { name: "KCFX 101.1 FM", url: "https://www.101thefox.com/" },
  "LAC": { name: "AM 570 LA Sports", url: "https://www.iheart.com/live/am-570-la-sports-1749/" },
  "LAR": { name: "ESPN LA 710", url: "https://www.espn.com/losangeles/radio/" },
  "LV": { name: "KRLV 920 AM", url: "https://www.foxsports920lasvegas.com/" },
  "MIA": { name: "WQAM 560 AM", url: "https://www.560wqam.com/" },
  "MIN": { name: "KFAN 100.3 FM", url: "https://www.kfan.com/" },
  "NE": { name: "98.5 The Sports Hub", url: "https://985thesportshub.com/" },
  "NO": { name: "WWL 870 AM", url: "https://www.wwl.com/" },
  "NYG": { name: "WFAN 660 AM", url: "https://www.wfan.com/" },
  "NYJ": { name: "ESPN New York", url: "https://www.espn.com/newyork/radio/" },
  "PHI": { name: "SportsRadio 94 WIP", url: "https://www.audacy.com/wip" },
  "PIT": { name: "KDKA 1020 AM", url: "https://www.audacy.com/kdkaradio" },
  "SF": { name: "KNBR 680", url: "https://www.knbr.com/" },
  "SEA": { name: "Sports Radio KJR", url: "https://www.kjr.com/" },
  "TB": { name: "WDAE 620 AM", url: "https://www.wdae.com/" },
  "TEN": { name: "104.5 The Zone", url: "https://www.1045thezone.com/" },
  "WAS": { name: "The Team 980", url: "https://theteam980.com/" },
};

const NFL_PODCASTS = [
  {
    id: "around-the-nfl",
    name: "Around The NFL",
    description: "NFL Network's flagship podcast with Gregg Rosenthal and the heroes",
    url: "https://www.nfl.com/podcasts/around-the-nfl",
    rssUrl: "https://rss.art19.com/around-the-nfl",
    icon: "podcast",
    network: "NFL Network"
  },
  {
    id: "fantasy-focus",
    name: "Fantasy Focus Football",
    description: "ESPN's fantasy football advice with Matthew Berry and the crew",
    url: "https://www.espn.com/radio/podcast/playPopup?id=2942665",
    rssUrl: "https://www.espn.com/espnradio/feeds/rss/podcast.xml?id=2942665",
    icon: "podcast",
    network: "ESPN"
  },
  {
    id: "fantasy-football-today",
    name: "Fantasy Football Today",
    description: "CBS Sports fantasy football coverage and analysis",
    url: "https://www.cbssports.com/fantasy/football/podcast/",
    rssUrl: "https://feeds.megaphone.fm/fantasy-football-today",
    icon: "podcast",
    network: "CBS Sports"
  },
  {
    id: "ringer-nfl",
    name: "The Ringer NFL Show",
    description: "In-depth NFL analysis from The Ringer's football experts",
    url: "https://www.theringer.com/nfl-show",
    rssUrl: "https://feeds.megaphone.fm/the-ringer-nfl-show",
    icon: "podcast",
    network: "The Ringer"
  },
  {
    id: "pat-mcafee",
    name: "The Pat McAfee Show",
    description: "Daily sports talk with former NFL punter Pat McAfee",
    url: "https://www.youtube.com/@PatMcAfeeShow",
    rssUrl: "https://feeds.megaphone.fm/pat-mcafee-show",
    icon: "podcast",
    network: "Pat McAfee"
  },
  {
    id: "pff-nfl",
    name: "PFF NFL Podcast",
    description: "Pro Football Focus analytics-driven NFL coverage",
    url: "https://www.pff.com/podcasts",
    rssUrl: "https://feeds.megaphone.fm/pff-nfl-podcast",
    icon: "podcast",
    network: "PFF"
  },
  {
    id: "move-the-sticks",
    name: "Move The Sticks",
    description: "NFL analysis with Daniel Jeremiah and Bucky Brooks",
    url: "https://www.nfl.com/podcasts/move-the-sticks",
    rssUrl: "https://rss.art19.com/move-the-sticks",
    icon: "podcast",
    network: "NFL Network"
  },
  {
    id: "good-morning-football",
    name: "Good Morning Football",
    description: "Weekday morning NFL show podcast",
    url: "https://www.nfl.com/podcasts/good-morning-football",
    rssUrl: "https://rss.art19.com/good-morning-football",
    icon: "podcast",
    network: "NFL Network"
  }
];

const TV_BROADCASTS = [
  {
    id: "nfl-network",
    name: "NFL Network",
    description: "24/7 NFL coverage and live games",
    url: "https://www.nfl.com/network/watch/nfl-network-live",
    icon: "tv",
    network: "NFL Network"
  },
  {
    id: "espn",
    name: "ESPN",
    description: "Monday Night Football and NFL coverage",
    url: "https://www.espn.com/watch/",
    icon: "tv",
    network: "ESPN"
  },
  {
    id: "fox-sports",
    name: "FOX Sports",
    description: "Sunday NFC games and NFL coverage",
    url: "https://www.foxsports.com/live",
    icon: "tv",
    network: "FOX"
  },
  {
    id: "cbs-sports",
    name: "CBS Sports",
    description: "Sunday AFC games and NFL coverage",
    url: "https://www.cbssports.com/watch/",
    icon: "tv",
    network: "CBS"
  },
  {
    id: "nbc-sports",
    name: "NBC Sports",
    description: "Sunday Night Football",
    url: "https://www.nbcsports.com/live",
    icon: "tv",
    network: "NBC"
  },
  {
    id: "amazon-prime",
    name: "Amazon Prime Thursday Night",
    description: "Thursday Night Football streaming",
    url: "https://www.amazon.com/tnf",
    icon: "stream",
    network: "Amazon Prime"
  }
];

const OFFICIAL_STREAMS = [
  {
    id: "nfl-plus",
    name: "NFL+",
    description: "Official NFL streaming service with live games",
    url: "https://www.nfl.com/plus",
    icon: "stream",
    network: "NFL"
  },
  {
    id: "nfl-gamepass",
    name: "NFL Game Pass",
    description: "Full game replays and All-22 coaches film",
    url: "https://www.nfl.com/gamepass",
    icon: "stream",
    network: "NFL"
  },
  {
    id: "nfl-youtube",
    name: "NFL YouTube",
    description: "Official NFL highlights and content",
    url: "https://www.youtube.com/nfl",
    icon: "stream",
    network: "YouTube"
  },
  {
    id: "espn-radio",
    name: "ESPN Radio",
    description: "National radio broadcast of NFL games",
    url: "https://www.espn.com/espnradio/",
    icon: "radio",
    network: "ESPN"
  },
  {
    id: "westwood-one",
    name: "Westwood One Sports",
    description: "National radio broadcast network",
    url: "https://westwoodonesports.com/nfl/",
    icon: "radio",
    network: "Westwood One"
  }
];

export class MediaService {
  private static instance: MediaService;

  public static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  async getMediaForGame(gameId: number): Promise<GameMediaLinks | null> {
    try {
      const game = await storage.getNflGame(gameId);
      if (!game) {
        logger.warn({ type: "media_service", gameId, message: "Game not found" });
        return null;
      }

      const [homeTeam, awayTeam] = await Promise.all([
        storage.getNflTeam(game.homeTeamId),
        storage.getNflTeam(game.visitorTeamId)
      ]);

      if (!homeTeam || !awayTeam) {
        logger.warn({ type: "media_service", gameId, message: "Teams not found" });
        return null;
      }

      const radioStreams = this.getRadioStreamsForGame(homeTeam.abbreviation, awayTeam.abbreviation);
      const tvBroadcasts = this.getTvBroadcasts(game.date, game.time);
      const podcasts = this.getPodcastLinks();
      const officialStreams = this.getOfficialStreams();

      return {
        gameId,
        homeTeam: homeTeam.fullName,
        awayTeam: awayTeam.fullName,
        gameDate: game.date,
        radioStreams,
        tvBroadcasts,
        podcasts,
        officialStreams
      };
    } catch (error) {
      logger.error({ type: "media_service_error", gameId, error: (error as Error).message });
      return null;
    }
  }

  private getRadioStreamsForGame(homeAbbr: string, awayAbbr: string): MediaLink[] {
    const streams: MediaLink[] = [];

    const homeRadio = NFL_TEAM_RADIO[homeAbbr];
    if (homeRadio) {
      streams.push({
        id: `radio-home-${homeAbbr.toLowerCase()}`,
        type: 'radio',
        name: `${homeAbbr} Radio: ${homeRadio.name}`,
        description: `Home team radio broadcast`,
        url: homeRadio.url,
        icon: 'radio',
        isLive: true,
        network: homeRadio.name
      });
    }

    const awayRadio = NFL_TEAM_RADIO[awayAbbr];
    if (awayRadio) {
      streams.push({
        id: `radio-away-${awayAbbr.toLowerCase()}`,
        type: 'radio',
        name: `${awayAbbr} Radio: ${awayRadio.name}`,
        description: `Away team radio broadcast`,
        url: awayRadio.url,
        icon: 'radio',
        isLive: true,
        network: awayRadio.name
      });
    }

    streams.push({
      id: 'espn-radio-national',
      type: 'radio',
      name: 'ESPN Radio',
      description: 'National radio broadcast',
      url: 'https://www.espn.com/espnradio/',
      icon: 'radio',
      isLive: true,
      network: 'ESPN'
    });

    return streams;
  }

  private getTvBroadcasts(gameDate: string, gameTime: string | null): MediaLink[] {
    const broadcasts: MediaLink[] = [];
    const date = new Date(gameDate);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 1) {
      broadcasts.push({
        id: 'mnf-espn',
        type: 'tv',
        name: 'Monday Night Football',
        description: 'Live on ESPN',
        url: 'https://www.espn.com/watch/',
        icon: 'tv',
        isLive: true,
        network: 'ESPN'
      });
    } else if (dayOfWeek === 4) {
      broadcasts.push({
        id: 'tnf-prime',
        type: 'tv',
        name: 'Thursday Night Football',
        description: 'Live on Amazon Prime Video',
        url: 'https://www.amazon.com/tnf',
        icon: 'tv',
        isLive: true,
        network: 'Amazon Prime'
      });
    } else if (dayOfWeek === 0) {
      broadcasts.push({
        id: 'sunday-fox',
        type: 'tv',
        name: 'FOX Sunday',
        description: 'NFC games on FOX',
        url: 'https://www.foxsports.com/live',
        icon: 'tv',
        isLive: true,
        network: 'FOX'
      });
      broadcasts.push({
        id: 'sunday-cbs',
        type: 'tv',
        name: 'CBS Sunday',
        description: 'AFC games on CBS',
        url: 'https://www.cbssports.com/watch/',
        icon: 'tv',
        isLive: true,
        network: 'CBS'
      });
      if (gameTime && parseInt(gameTime.split(':')[0]) >= 20) {
        broadcasts.push({
          id: 'snf-nbc',
          type: 'tv',
          name: 'Sunday Night Football',
          description: 'Live on NBC',
          url: 'https://www.nbcsports.com/live',
          icon: 'tv',
          isLive: true,
          network: 'NBC'
        });
      }
    }

    broadcasts.push({
      id: 'nfl-network-live',
      type: 'tv',
      name: 'NFL Network',
      description: '24/7 NFL coverage',
      url: 'https://www.nfl.com/network/watch/nfl-network-live',
      icon: 'tv',
      isLive: true,
      network: 'NFL Network'
    });

    return broadcasts;
  }

  private getPodcastLinks(): MediaLink[] {
    return NFL_PODCASTS.map(podcast => ({
      id: podcast.id,
      type: 'podcast' as MediaType,
      name: podcast.name,
      description: podcast.description,
      url: podcast.url,
      icon: podcast.icon,
      isLive: false,
      network: podcast.network
    }));
  }

  private getOfficialStreams(): MediaLink[] {
    return OFFICIAL_STREAMS.map(stream => ({
      id: stream.id,
      type: stream.icon === 'radio' ? 'radio' as MediaType : 'stream' as MediaType,
      name: stream.name,
      description: stream.description,
      url: stream.url,
      icon: stream.icon,
      isLive: stream.icon !== 'stream',
      network: stream.network
    }));
  }

  getAllPodcasts(): MediaLink[] {
    return this.getPodcastLinks();
  }

  getAllTvNetworks(): MediaLink[] {
    return TV_BROADCASTS.map(tv => ({
      id: tv.id,
      type: 'tv' as MediaType,
      name: tv.name,
      description: tv.description,
      url: tv.url,
      icon: tv.icon,
      isLive: true,
      network: tv.network
    }));
  }

  getTeamRadio(teamAbbr: string): MediaLink | null {
    const radio = NFL_TEAM_RADIO[teamAbbr.toUpperCase()];
    if (!radio) return null;
    
    return {
      id: `radio-${teamAbbr.toLowerCase()}`,
      type: 'radio',
      name: radio.name,
      description: `${teamAbbr} team radio broadcast`,
      url: radio.url,
      icon: 'radio',
      isLive: true,
      network: radio.name
    };
  }
}

export const mediaService = MediaService.getInstance();

export async function getGameMedia(gameId: number): Promise<GameMediaLinks | null> {
  return mediaService.getMediaForGame(gameId);
}

export function getAllPodcasts(): MediaLink[] {
  return mediaService.getAllPodcasts();
}

export function getAllTvNetworks(): MediaLink[] {
  return mediaService.getAllTvNetworks();
}

export function getTeamRadio(teamAbbr: string): MediaLink | null {
  return mediaService.getTeamRadio(teamAbbr);
}
