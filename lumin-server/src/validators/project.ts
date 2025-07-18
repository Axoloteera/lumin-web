import { z } from 'zod';
import { hasZipMagic } from "../utils/zip";



export const createProjectSchema = z.object({

});

export const updateProjectSchema = z.object({
  domain: z.string().min(1).max(12).regex(/^[a-zA-Z0-9_]+$/).optional(),
  name: z.string().min(1).max(12).optional(),
  description: z.string().max(4089).optional(),
});

export const queryProjectSchema = z.object({
  name: z.string().optional(),
  hasIndex: z.string().optional(),
  userId: z.string().optional(),
});

export const uploadZipSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      async (file) => (file.type === 'application/zip' || file.name.endsWith('.zip') && await hasZipMagic(file)),
      { message: '必须上传 ZIP 文件' }
    )
    .refine(
      (file) => file.size <= 100 * 1024 * 1024,
      { message: '文件大小不能超过 100MB' }
    ),
});