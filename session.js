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

module.exports = { getConfig, updateConfig };
