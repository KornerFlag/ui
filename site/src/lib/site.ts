export function withBase(path: string | null | undefined): string {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function formatDuration(totalSeconds: number | null | undefined): string {
  const seconds = Math.max(0, Math.round(totalSeconds || 0));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function clipTitle(clip: Record<string, any> | null | undefined): string {
  if (!clip) {
    return "Match analysis";
  }

  return (
    clip.title ||
    clip.match_title ||
    clip.match_label ||
    clip.name ||
    String(clip.clip_id || "match-analysis")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

export function clipSubtitle(clip: Record<string, any> | null | undefined): string {
  if (!clip) {
    return "Demo room";
  }

  return (
    clip.competition ||
    clip.opponent ||
    clip.event ||
    clip.location ||
    "Coach review room"
  );
}

export function clipVideo(clip: Record<string, any> | null | undefined): string {
  if (!clip) {
    return "";
  }

  return (
    clip.local_video_url ||
    clip.video_url ||
    clip.video_file ||
    clip.video ||
    clip.annotated_video ||
    clip.output_video ||
    ""
  );
}

export function clipThumbnail(clip: Record<string, any> | null | undefined): string {
  if (!clip) {
    return "";
  }

  return (
    clip.thumbnail_url ||
    clip.thumbnail_file ||
    clip.thumbnail ||
    clip.poster ||
    clip.preview_image ||
    ""
  );
}

export function clipHeatmap(
  clip: Record<string, any> | null | undefined,
  team: 1 | 2,
): string {
  if (!clip) {
    return "";
  }

  if (team === 1) {
    return clip.heatmap_team1_url || clip.heatmapTeam1Url || "";
  }

  return clip.heatmap_team2_url || clip.heatmapTeam2Url || "";
}

export function formatDistance(km: number | null | undefined): string {
  const value = Number(km || 0);
  if (!Number.isFinite(value) || value <= 0) {
    return "0.0 km";
  }

  return `${value.toFixed(1)} km`;
}

export function safeNumber(value: number | null | undefined, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function humanizeId(value: string | null | undefined): string {
  if (!value) {
    return "Unlabeled";
  }

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function normalizeStats(
  stats: Record<string, any> | null | undefined,
  clip: Record<string, any> | null | undefined = null,
) {
  const source = stats || {};

  const team1Pct = safeNumber(
    source.team_possession?.team1 ?? source.possession?.team_1_percent,
  );
  const team2Pct = safeNumber(
    source.team_possession?.team2 ?? source.possession?.team_2_percent,
  );

  const team1Label =
    source.team_names?.team1 || clip?.team1 || clip?.home_team || "Team 1";
  const team2Label =
    source.team_names?.team2 || clip?.team2 || clip?.away_team || "Team 2";

  const normalizedPlayers = source.player_stats
    ? [
        ...(source.player_stats.team1 || []).map((player: Record<string, any>) => ({
          player_id: String(player.player_id),
          team: 1,
          total_distance_km: safeNumber(
            player.total_distance_km,
            safeNumber(player.distance_m) / 1000,
          ),
          max_speed_kmh: safeNumber(player.max_speed_kmh),
          avg_speed_kmh: safeNumber(player.avg_speed_kmh),
        })),
        ...(source.player_stats.team2 || []).map((player: Record<string, any>) => ({
          player_id: String(player.player_id),
          team: 2,
          total_distance_km: safeNumber(
            player.total_distance_km,
            safeNumber(player.distance_m) / 1000,
          ),
          max_speed_kmh: safeNumber(player.max_speed_kmh),
          avg_speed_kmh: safeNumber(player.avg_speed_kmh),
        })),
      ]
    : Object.entries(source.players || {}).map(([playerId, player]: [string, any]) => ({
        player_id: String(playerId),
        team: safeNumber(player.team),
        total_distance_km: safeNumber(player.distance_m) / 1000,
        max_speed_kmh: safeNumber(player.max_speed_kmh),
        avg_speed_kmh: safeNumber(player.avg_speed_kmh),
      }));

  const team1Players = normalizedPlayers.filter((player) => player.team === 1);
  const team2Players = normalizedPlayers.filter((player) => player.team === 2);

  return {
    team1Pct,
    team2Pct,
    team1Label,
    team2Label,
    team1Players,
    team2Players,
    allPlayers: normalizedPlayers,
    passing: source.pass_tracking || source.passing || null,
  };
}
