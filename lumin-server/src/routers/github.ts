import { Hono } from 'hono';
import { Project } from '../database/models/project';
import { downloadAndProcessRepo, handleAuthCallback, updateCheckStatus } from '../services/githubService';
import { extractRepoInfo, validateWebhookSignature } from '../utils/github';
import config from '../config';

const github = new Hono();

// GitHub webhook endpoint
github.post('/_webhook', async (c) => {
  try {
    const payload = await c.req.json();
    const signature = c.req.header('x-hub-signature-256');
    const webhookSecret = config.github.webhook_secret;

    // Validate webhook signature
    if (webhookSecret && signature) {
      const rawBody = await c.req.text();
      const isValid = validateWebhookSignature(rawBody, signature, webhookSecret);

      if (!isValid) {
        console.error('Invalid webhook signature');
        return c.json({ error: 'Invalid webhook signature' }, 401);
      }
    }

    // Only process push events
    const event = c.req.header('x-github-event');
    if (event !== 'push') {
      return c.json({ message: 'Event ignored' }, 200);
    }

    // Extract repository information
    const { owner, repo, ref, sha } = extractRepoInfo(payload);

    // Find the project associated with this repository
    const project = await Project.findOne({
      where: {
        githubOwner: owner,
        githubRepo: repo,
      },
    });

    if (!project) {
      console.error(`No project found for repository ${owner}/${repo}`);
      return c.json({ error: 'No project found for this repository' }, 404);
    }

    // Update check status to in_progress
    await updateCheckStatus(owner, repo, sha, 'in_progress');

    // Download and process the repository
    const success = await downloadAndProcessRepo(owner, repo, project, ref);

    // Update check status based on result
    await updateCheckStatus(
      owner,
      repo,
      sha,
      'completed',
      success ? 'success' : 'failure',
      success ? `https://${project.domain}.axopl.com` : undefined
    );

    return c.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GitHub App callback endpoint
github.get('/callback', async (c) => {
  try {
    const code = c.req.query('code');

    if (!code) {
      return c.json({ error: 'No code provided' }, 400);
    }

    const tokenData = await handleAuthCallback(code);

    // Here you would typically store the token and associate it with a user
    // For now, we'll just return it
    return c.json(tokenData);
  } catch (error) {
    console.error('Error handling callback:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default github;
