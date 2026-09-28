/* Types for the Supero runtime globals.
 *
 * The generated index.html loads ~30 runtime scripts BEFORE our bundle, which
 * define these as page-level globals. We only describe them here — declaring or
 * importing any of them would shadow the real thing and break the app.
 */

export interface SuperoConfig {
  domain: string;
  project: string;
  project_uuid: string;
  tenant: string;
  apiUrl: string;
  appName: string;
  appEmoji: string;
  appDescription: string;
  publicSchemas: string[];
  isMultiTenant: boolean;
  tenantNoun?: { singular: string; plural: string };
  appNamespace: string;
}

export interface SuperoRecord {
  uuid: string;
  name?: string;
  display_name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  fq_name?: string[];
  parent_type?: string;
  parent_uuid?: string;
  [key: string]: unknown;
}

export interface RefError {
  ref_name: string;
  [key: string]: unknown;
}

export interface SuperoClient {
  login(domain: string, email: string, password: string, project: string, tenant: string): Promise<unknown>;
  logout(): void;
  isAuthenticated(): boolean;
  userInfo?: { email?: string; role?: string; fullName?: string; uuid?: string };
  tenant?: string;
  project?: string;

  getObjects(schema: string, opts?: { limit?: number; offset?: number }): Promise<SuperoRecord[] | { results: SuperoRecord[] }>;
  createObject(schema: string, data: Record<string, unknown>): Promise<SuperoRecord>;
  createObjectWithRefs(
    schema: string,
    data: Record<string, unknown>,
    refs: Array<{ ref_name: string; ref_uuid: string }>,
  ): Promise<{ object: SuperoRecord; refErrors: RefError[] }>;
  updateObject(schema: string, uuid: string, data: Record<string, unknown>, item?: SuperoRecord): Promise<unknown>;
  deleteObject(schema: string, uuid: string, item?: SuperoRecord): Promise<unknown>;

  can(action: string, schema: string): boolean;
  canWrite(schema: string): boolean;
  isAdmin(): boolean;
  canSwitchTenant(): boolean;
  setTenantOverride(name: string | null): void;
}

export interface WorkflowResult {
  status?: string;
  [key: string]: unknown;
}

export interface SuperoServices {
  workflow?: { run(id: string, input: Record<string, unknown>): Promise<WorkflowResult> };
  [key: string]: unknown;
}

declare global {
  // eslint-disable-next-line no-var
  var client: SuperoClient;
  // eslint-disable-next-line no-var
  var services: SuperoServices | undefined;
  interface Window {
    __SUPERO_CONFIG?: SuperoConfig;
    __superoUILoaded?: boolean;
    client: SuperoClient;
    services?: SuperoServices;
    showToast?: (msg: string, kind?: 'success' | 'error' | 'warning' | 'info') => void;
  }
}

export {};
