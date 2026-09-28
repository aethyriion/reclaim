/* Workflow-first actions with a direct-CRUD fallback.
 *
 * Importing the `workflows` service needs a domain-level permission that the
 * project-scoped key a cloud deploy runs under does not have. The import fails
 * silently — `services.workflow` is simply absent — so every workflow-driven
 * action here also names the CRUD writes that are equivalent and falls back to
 * them.
 *
 * The fallback runs as the caller, so an engineer's fallback does strictly less
 * than an admin's. That is correct: the server still decides. We only stop
 * pretending a button worked when it did not.
 */

export type Via = 'workflow' | 'direct';

export async function act(
  workflowId: string,
  input: Record<string, unknown>,
  fallback: () => Promise<unknown>,
): Promise<Via> {
  try {
    const run = window.services?.workflow?.run;
    if (!run) throw new Error('workflows unavailable');
    const result = await run.call(window.services!.workflow, workflowId, input);
    if (result?.status === 'failed') throw new Error('workflow reported failed');
    return 'workflow';
  } catch {
    await fallback();
    return 'direct';
  }
}
