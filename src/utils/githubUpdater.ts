// Dynamic build commit injected by Vite at compile time, or fallback to latest known
declare const __APP_COMMIT_SHA__: string | undefined;

export const CURRENT_COMMIT_SHA =
  typeof __APP_COMMIT_SHA__ !== 'undefined' && __APP_COMMIT_SHA__
    ? __APP_COMMIT_SHA__.substring(0, 7)
    : '90887a0';

export const GITHUB_REPO = 'pietersensamuel088-ship-it/breezy';

export interface GitHubCommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  date: string;
  author: string;
}

/**
 * Permanently dismisses or acknowledges an update for a specific commit SHA
 * and records timestamp to prevent nagging loops across reloads.
 */
export function dismissUpdate(sha?: string) {
  try {
    if (typeof localStorage !== 'undefined') {
      if (sha) {
        localStorage.setItem('breezy_dismissed_update_sha', sha);
      }
      localStorage.setItem('breezy_dismissed_update_time', Date.now().toString());
    }
  } catch {}
}

/**
 * Checks if a specific commit SHA has already been dismissed or acknowledged
 */
export function isUpdateDismissed(sha: string): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;

    // Check if dismissed within the last 24 hours (prevents nagging loop on refresh)
    const dismissedTime = localStorage.getItem('breezy_dismissed_update_time');
    if (dismissedTime) {
      const elapsed = Date.now() - parseInt(dismissedTime, 10);
      if (elapsed < 24 * 60 * 60 * 1000) {
        return true;
      }
    }

    if (!sha) return false;
    const dismissed = localStorage.getItem('breezy_dismissed_update_sha');
    if (!dismissed) return false;
    return (
      sha.toLowerCase().startsWith(dismissed.toLowerCase()) ||
      dismissed.toLowerCase().startsWith(sha.toLowerCase())
    );
  } catch {
    return false;
  }
}

/**
 * Checks GitHub repository for the latest commit on main branch
 */
export async function checkForGitHubUpdate(): Promise<{
  hasUpdate: boolean;
  currentSha: string;
  latestCommit: GitHubCommitInfo | null;
  error?: string;
}> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits/main`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return {
        hasUpdate: false,
        currentSha: CURRENT_COMMIT_SHA,
        latestCommit: null,
        error: `GitHub API error: ${res.statusText}`,
      };
    }

    const data = await res.json();
    const remoteSha = data.sha as string;
    const shortSha = remoteSha.substring(0, 7);

    const latestCommit: GitHubCommitInfo = {
      sha: remoteSha,
      shortSha,
      message: data.commit.message,
      date: data.commit.committer?.date || data.commit.author?.date,
      author: data.commit.author?.name || 'Developer',
    };

    // If user already dismissed or updated this commit, don't show prompt!
    const isDismissed = isUpdateDismissed(remoteSha) || isUpdateDismissed(shortSha);

    // If remote commit SHA is different from current local build SHA AND not dismissed:
    const isNewer =
      !remoteSha.toLowerCase().startsWith(CURRENT_COMMIT_SHA.toLowerCase()) &&
      !CURRENT_COMMIT_SHA.toLowerCase().startsWith(shortSha.toLowerCase());

    const hasUpdate = isNewer && !isDismissed;

    return {
      hasUpdate,
      currentSha: CURRENT_COMMIT_SHA,
      latestCommit,
    };
  } catch (err: any) {
    return {
      hasUpdate: false,
      currentSha: CURRENT_COMMIT_SHA,
      latestCommit: null,
      error: err?.message || 'Network error checking GitHub',
    };
  }
}
