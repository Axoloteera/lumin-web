import JSZip from 'jszip';
import { Project } from '../database/models/project';
import { File } from '../database/models/file';
import { sequelize } from '../database';
import { lookup } from 'mime-types';
import { saveFile } from './file';

/**
 * Processes a ZIP file for a project
 * This is similar to the processZipFileUpload function in the project router
 * but adapted for GitHub repositories
 */
export const processZipFileUpload = async (arrayBuffer: ArrayBuffer, project: Project): Promise<void> => {
  const projectId = project.id;
  let hasIndex = false;

  await sequelize.transaction(async (t) => {
    // Delete existing files for this project
    await File.destroy({ where: { projectId }, transaction: t });
    
    // Create root folder
    const rootFolder = await File.create({
      name: 'Root',
      folder: true,
      projectId,
      parentId: null,
    }, { transaction: t });

    // Load and process the ZIP file
    const zip = await JSZip.loadAsync(arrayBuffer);
    const filePromises: Promise<any>[] = [];
    const entries = Object.values(zip.files);
    
    // GitHub repository ZIPs have a top-level directory with the repo name
    // We need to strip this prefix from the paths
    const topLevelDirRegex = /^[^\/]+\//;
    
    for (const zipEntry of entries) {
      // Skip the top-level directory itself
      if (zipEntry.name.match(/^[^\/]+\/$/) || zipEntry.name === '') {
        continue;
      }
      
      // Remove the top-level directory from the path
      const relativePath = zipEntry.name.replace(topLevelDirRegex, '');
      
      // Skip if the path is empty after removing the prefix
      if (!relativePath) {
        continue;
      }
      
      const pathParts = relativePath.split('/').filter(Boolean);

      let parentId = rootFolder.id;

      if (!zipEntry.dir) {
        const content = await zipEntry.async('nodebuffer');
        const fileId = await saveFile(Buffer.from(content));
        const fileName = pathParts[pathParts.length - 1];

        console.log("Creating file path", relativePath);
        filePromises.push(
          File.create({
            name: fileName,
            folder: false,
            fileId,
            projectId,
            parentId,
            path: relativePath,
            mimeType: lookup(fileName) || 'text/plain'
          }, { transaction: t })
        );

        if (relativePath === "index.html") {
          hasIndex = true;
        }
      }
    }

    await Promise.all(filePromises);
  });
  
  // Update the project to indicate if it has an index.html file
  await project.update({ hasIndex });
};

/**
 * Validates a GitHub webhook signature
 */
export const validateWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
};

/**
 * Extracts repository information from a GitHub webhook payload
 */
export const extractRepoInfo = (payload: any): { 
  owner: string; 
  repo: string; 
  ref: string;
  sha: string;
} => {
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const ref = payload.ref.replace('refs/heads/', '');
  const sha = payload.after;
  
  return { owner, repo, ref, sha };
};