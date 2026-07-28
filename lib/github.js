const OWNER = () => process.env.GITHUB_OWNER;
const REPO = () => process.env.GITHUB_REPO;
const BRANCH = () => process.env.GITHUB_BRANCH || 'main';
const CONFIG_PATH = 'config.json';

async function client() {
    const { Octokit } = await import('octokit');
    return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

async function getConfig() {
    const octokit = await client();
    const res = await octokit.rest.repos.getContent({
        owner: OWNER(), repo: REPO(), path: CONFIG_PATH, ref: BRANCH(),
    });
    const content = Buffer.from(res.data.content, 'base64').toString('utf-8');
    return { config: JSON.parse(content), sha: res.data.sha };
}

async function updateConfig(mutateFn, message) {
    const octokit = await client();
    const { config, sha } = await getConfig();
    mutateFn(config);
    const content = Buffer.from(JSON.stringify(config, null, 2) + '\n', 'utf-8').toString('base64');
    await octokit.rest.repos.createOrUpdateFileContents({
        owner: OWNER(), repo: REPO(), path: CONFIG_PATH,
        message: message || 'Update config.json via dashboard',
        content, sha, branch: BRANCH(),
    });
    return config;
}

/**
 * Commit an arbitrary file (already base64-encoded) to the repo, e.g. a
 * font uploaded from the dashboard. Looks up the existing sha first so
 * this also works for overwriting/updating a file that already exists.
 */
async function putFile(path, base64Content, message) {
    const octokit = await client();
    let sha;
    try {
        const existing = await octokit.rest.repos.getContent({
            owner: OWNER(), repo: REPO(), path, ref: BRANCH(),
        });
        sha = existing.data.sha;
    } catch (err) {
        if (err.status !== 404) throw err; // 404 just means it's a new file
    }
    const res = await octokit.rest.repos.createOrUpdateFileContents({
        owner: OWNER(), repo: REPO(), path,
        message: message || `Add ${path} via dashboard`,
        content: base64Content, sha, branch: BRANCH(),
    });
    return res.data;
}

function repoInfo() {
    return { owner: OWNER(), repo: REPO(), branch: BRANCH() };
}

module.exports = { getConfig, updateConfig, putFile, repoInfo };
