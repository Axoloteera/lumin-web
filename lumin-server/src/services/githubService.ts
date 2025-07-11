import axios from 'axios';
import { Project } from '../database/models/project';
import { processZipFileUpload } from '../utils/github';
import { Octokit } from '@octokit/rest';
import config from '../config';

// GitHub App credentials
const GITHUB_APP_ID = config.github.app_id;
const GITHUB_PRIVATE_KEY = config.github.private_key;
const GITHUB_CLIENT_ID = config.github.client_id;
const GITHUB_CLIENT_SECRET = config.github.client_secret;
const GITHUB_WEBHOOK_SECRET = config.github.webhook_secret;

/**
 * Downloads a repository as a ZIP file and processes it for a project
 */
export const downloadAndProcessRepo = async (
  owner: string,
  repo: string,
  project: Project,
  ref: string = 'main'
): Promise<boolean> => {
  try {
    console.log(`Downloading repository ${owner}/${repo} at ref ${ref}`);

    // Download the repository as a ZIP file
    const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${ref}.zip`;
    const response = await axios.get(zipUrl, {
      responseType: 'arraybuffer',
    });

    // Process the ZIP file
    await processZipFileUpload(response.data, project);

    console.log(`Successfully processed repository ${owner}/${repo}`);
    return true;
  } catch (error) {
    console.error('Error downloading and processing repository:', error);
    return false;
  }
};

/**
 * Updates the GitHub check status for a repository
 */
export const updateCheckStatus = async (
  owner: string,
  repo: string,
  sha: string,
  status: 'queued' | 'in_progress' | 'completed',
  conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required',
  detailsUrl?: string
): Promise<void> => {
  try {
    // Initialize Octokit with GitHub App authentication
    const octokit = new Octokit({
      auth: {
        appId: GITHUB_APP_ID,
        privateKey: GITHUB_PRIVATE_KEY,
      },
    });

    // Create or update check run
    await octokit.checks.create({
      owner,
      repo,
      name: 'Lumin Deployment',
      head_sha: sha,
      status,
      conclusion,
      details_url: detailsUrl,
      output: {
        title: status === 'completed' ? 'Deployment completed' : 'Deployment in progress',
        summary: status === 'completed' 
          ? `The deployment ${conclusion === 'success' ? 'succeeded' : 'failed'}.` 
          : 'The deployment is in progress.',
      },
    });

    console.log(`Updated check status for ${owner}/${repo}@${sha} to ${status}`);
  } catch (error) {
    console.error('Error updating check status:', error);
  }
};

/**
 * Handles GitHub App authentication callback
 */
export const handleAuthCallback = async (code: string): Promise<any> => {
  try {
    // Exchange code for access token
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error handling GitHub auth callback:', error);
    throw error;
  }
};
