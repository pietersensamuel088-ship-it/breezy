// Current local build commit hash (updated on build/commit)
export const CURRENT_COMMIT_SHA = '6edc3b6';
export const GITHUB_REPO = 'pietersensamuel088-ship-it/breezy';

export interface GitHubCommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  date: string;
  author: string;
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

    // If remote commit SHA is different from current local build SHA, an update is ready!
    const hasUpdate = !remoteSha.startsWith(CURRENT_COMMIT_SHA);

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
