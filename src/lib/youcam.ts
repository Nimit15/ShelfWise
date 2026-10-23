import { YouCamScanResult, YouCamConcern, YouCamSkinType } from '@/types/youcam';

const BASE_URL = 'https://yce-api-01.makeupar.com';
const UPLOAD_PATH = '/s2s/v2.0/file';
const TASK_PATH_V2_1 = '/s2s/v2.1/task/skin-analysis';
const CREDIT_BALANCE_PATH = '/s2s/v1.0/client/credit';
const FEATURE_COST_PATH = '/s2s/v2.0/credit/feature-cost';

interface YouCamUploadResponse {
  data: {
    files: Array<{
      file_id: string;
      requests: Array<{
        url: string;
        headers?: Record<string, string>;
      }>;
    }>;
  };
}

interface YouCamTaskResponse {
  data: {
    task_id: string;
  };
}

interface YouCamStatusResponse {
  data: {
    task_status: 'running' | 'success' | 'error';
    results?: YouCamScanResult;
    error?: string;
    error_message?: string;
  };
}

interface CreditBalanceResponse {
  results: Array<{
    type: string;
    amount: number;
  }>;
}

interface FeatureCostResponse {
  result: {
    skus: Array<{
      description: string;
      amount: number;
      unit: string;
      proc_unit: number;
      run_task_url: string;
    }>;
    next_token?: string;
  };
}

function getApiKey(): string {
  const key = process.env.YOUCAM_API_KEY;
  if (!key) {
    throw new Error('YOUCAM_API_KEY environment variable not set');
  }
  return key;
}

function getHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
    'X-Pxy-Src': 'skill',
  };
}

async function uploadFile(file: Buffer, filename: string, contentType: string): Promise<string> {
  const metaResponse = await fetch(`${BASE_URL}${UPLOAD_PATH}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      files: [{
        content_type: contentType,
        file_name: filename,
        file_size: file.length,
      }],
    }),
  });

  if (!metaResponse.ok) {
    throw new Error(`Upload metadata failed: ${metaResponse.statusText}`);
  }

  const meta = await metaResponse.json() as YouCamUploadResponse;
  const putReq = meta.data.files[0].requests[0];

  const putResponse = await fetch(putReq.url, {
    method: 'PUT',
    headers: putReq.headers || { 'Content-Type': contentType },
    body: file as unknown as BodyInit,
  });

  if (!putResponse.ok) {
    throw new Error(`File upload failed: ${putResponse.statusText}`);
  }

  return meta.data.files[0].file_id;
}

async function createTask(fileId: string, params: Record<string, unknown>): Promise<string> {
  const response = await fetch(`${BASE_URL}${TASK_PATH_V2_1}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      src_file_id: fileId,
      ...params,
    }),
  });

  if (!response.ok) {
    throw new Error(`Task creation failed: ${response.statusText}`);
  }

  const data = await response.json() as YouCamTaskResponse;
  return data.data.task_id;
}

async function pollTask(taskId: string, maxPolls = 20, interval = 5000): Promise<YouCamStatusResponse['data']> {
  for (let i = 0; i < maxPolls; i++) {
    const response = await fetch(`${BASE_URL}${TASK_PATH_V2_1}/${taskId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    const data = await response.json() as YouCamStatusResponse;
    const taskData = data.data;

    if (taskData.task_status === 'success' || taskData.task_status === 'error') {
      return taskData;
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  // Return last known status if max polls reached
  const response = await fetch(`${BASE_URL}${TASK_PATH_V2_1}/${taskId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await response.json() as YouCamStatusResponse;
  return data.data;
}

export async function runSkinAnalysis(
  file: Buffer,
  filename: string,
  contentType: string,
  options: {
    tier: 'SD' | 'HD';
    concerns: string[];
    enableMaskOverlay: boolean;
  }
): Promise<YouCamScanResult> {
  const { tier, concerns, enableMaskOverlay } = options;

  // Validate: never mix SD and HD concerns
  const isHD = tier === 'HD';
  const invalidConcerns = concerns.filter(c =>
    isHD ? !c.startsWith('hd_') : c.startsWith('hd_')
  );
  if (invalidConcerns.length > 0) {
    throw new Error(`Cannot mix SD and HD concerns. Invalid for ${tier}: ${invalidConcerns.join(', ')}`);
  }

  // Upload file
  const fileId = await uploadFile(file, filename, contentType);

  // Create task
  const taskId = await createTask(fileId, {
    format: 'json',
    dst_actions: concerns,
    miniserver_args: {
      enable_mask_overlay: enableMaskOverlay,
    },
  });

  // Poll for result
  const result = await pollTask(taskId);

  if (result.task_status === 'error') {
    throw new Error(`YouCam API error: ${result.error_message || result.error}`);
  }

  if (!result.results) {
    throw new Error('No results returned from YouCam API');
  }

  return result.results;
}

export async function getCreditBalance(): Promise<{
  apiSpendableUnits: number;
  byType: Record<string, number>;
}> {
  const response = await fetch(`${BASE_URL}${CREDIT_BALANCE_PATH}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Credit balance check failed: ${response.statusText}`);
  }

  const data = await response.json() as CreditBalanceResponse;
  const batches = data.results || [];

  const apiSpendableUnits = batches
    .filter(b => b.type.startsWith('Api'))
    .reduce((sum, b) => sum + b.amount, 0);

  const byType: Record<string, number> = {};
  batches.forEach(b => {
    byType[b.type] = (byType[b.type] || 0) + b.amount;
  });

  return { apiSpendableUnits, byType };
}

export async function getFeatureCosts(): Promise<Array<{
  description: string;
  amount: number;
  unit: string;
  procUnit: number;
  feature: string;
}>> {
  const response = await fetch(`${BASE_URL}${FEATURE_COST_PATH}?page_size=20`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Feature cost check failed: ${response.statusText}`);
  }

  const data = await response.json() as FeatureCostResponse;
  const skus = data.result.skus || [];

  return skus
    .filter(s => s.run_task_url.includes('/task/skin-analysis'))
    .map(s => ({
      description: s.description || '',
      amount: s.amount,
      unit: s.unit,
      procUnit: s.proc_unit,
      feature: s.run_task_url.split('/task/')[1]?.split('/')[0] || 'skin-analysis',
    }));
}

export function calculateSDCost(concernCount: number): number {
  if (concernCount <= 4) return 9;
  if (concernCount <= 8) return 12;
  if (concernCount <= 12) return 14;
  return 16;
}

export function calculateHDCost(concernCount: number): number {
  if (concernCount <= 4) return 12;
  if (concernCount <= 8) return 16;
  if (concernCount <= 12) return 20;
  return 22;
}

export const ALL_SD_CONCERNS = [
  'wrinkle', 'pore', 'texture', 'acne', 'oiliness', 'radiance',
  'eye_bag', 'age_spot', 'dark_circle_v2', 'droopy_upper_eyelid',
  'droopy_lower_eyelid', 'firmness', 'moisture', 'redness',
  'tear_trough', 'skin_type'
];

export const ALL_HD_CONCERNS = [
  'hd_wrinkle', 'hd_pore', 'hd_texture', 'hd_acne', 'hd_oiliness', 'hd_radiance',
  'hd_eye_bag', 'hd_age_spot', 'hd_dark_circle', 'hd_droopy_upper_eyelid',
  'hd_droopy_lower_eyelid', 'hd_firmness', 'hd_moisture', 'hd_redness',
  'hd_tear_trough', 'hd_skin_type'
];

export function parseScanResults(results: YouCamScanResult): {
  concerns: YouCamConcern[];
  skinType: YouCamSkinType;
  skinAge: number;
  overallScore: number;
} {
  const concerns: YouCamConcern[] = [];
  let skinType: YouCamSkinType = { type: 'Normal', region: 'whole' };
  let skinAge = 0;
  let overallScore = 0;

  for (const item of results.output) {
    if (item.type === 'skin_type') {
      skinType = {
        type: (item.skin_type as YouCamSkinType["type"]) || 'Normal',
        region: (item.region as YouCamSkinType["region"]) || 'whole',
      };
    } else if (item.type === 'skin_age') {
      skinAge = item.score || 0;
    } else if (item.type === 'all') {
      overallScore = item.score || 0;
    } else if (item.ui_score !== undefined) {
      concerns.push({
        type: item.type,
        uiScore: item.ui_score,
        rawScore: item.raw_score || 0,
        maskUrls: item.mask_urls || [],
      });
    }
  }

  return { concerns, skinType, skinAge, overallScore };
}