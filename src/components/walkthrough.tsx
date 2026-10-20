"use client";

import { useActionState } from "react";

import { type ConnectProjectState, connectProject, type SendTrafficState, sendSimulatedTraffic } from "@/app/actions";
import { Icon } from "@/components/icon";
import {
  deliveryMessage,
  type StepState,
  verdictBadge,
  verdictDetail,
  verdictLabel,
  verdictTone,
  walkthroughSteps,
} from "@/lib/simulation/presentation";
import { type VisitorKind, simulatedVisitors } from "@/lib/simulation/visitors";
import { readmeUrl, sourceUrl } from "@/lib/site";
import { vouchedLinks } from "@/lib/vouched";

const visitorGroups: { kind: VisitorKind; heading: string }[] = [
  { kind: "ai-agent", heading: "AI agents browsing for a person" },
  { kind: "bot", heading: "Crawlers and scripts" },
];

export interface WalkthroughProps {
  readonly projectId?: string;
  readonly apiKeyHint?: string;
  /** Saving keys and sending traffic only work in development, from the machine running the app */
  readonly canUseDeveloperTools: boolean;
  readonly envFileName: string;
}

export function Walkthrough({ projectId, apiKeyHint, canUseDeveloperTools, envFileName }: WalkthroughProps) {
  const [connection, connect, isSaving] = useActionState<ConnectProjectState, FormData>(connectProject, {
    status: "idle",
  });
  const [simulation, simulate, isSending] = useActionState<SendTrafficState, FormData>(sendSimulatedTraffic, {
    status: "idle",
  });

  const hasProjectId = projectId !== undefined;
  const hasApiKey = apiKeyHint !== undefined;
  const report = simulation.status === "sent" ? simulation.report : undefined;
  const steps = walkthroughSteps({ hasProjectId, isSaving, delivery: report?.delivery });

  const keysForm = (
    <KeysForm action={connect} state={connection} isSaving={isSaving} projectId={projectId} envFileName={envFileName} />
  );

  return (
    <ol className="steps">
      <li className={`step step--${steps.connect}`}>
        <StepMarker state={steps.connect} number={1} />

        <section className="step__panel" id="connect" aria-labelledby="connect-title">
          <header className="step__header">
            <h2 id="connect-title" className="step__title">
              Connect your Vouched project
            </h2>
            <ConnectionPill isSaving={isSaving} hasProjectId={hasProjectId} hasApiKey={hasApiKey} />
          </header>

          {hasProjectId ? (
            <>
              <dl className="facts">
                <div className="facts__item">
                  <dt>Project ID</dt>
                  <dd>
                    <code data-testid="project-id">{projectId}</code>
                  </dd>
                </div>
                <div className="facts__item">
                  <dt>API key</dt>
                  <dd>{hasApiKey ? <code>{apiKeyHint}</code> : <span className="facts__empty">Not added</span>}</dd>
                </div>
              </dl>

              {!hasApiKey && (
                <p className="step__text step__text--below">
                  The Checkpoint pixel on this page is reporting your visits to your dashboard. Add an API key to report
                  this app&apos;s server-side detections too, like the simulated traffic in step 2.{" "}
                  <a href={readmeUrl("3-create-an-api-key-optional")} target="_blank" rel="noopener">
                    How to create one
                  </a>
                </p>
              )}

              {canUseDeveloperTools && (
                <details
                  className="disclosure"
                  open={connection.status === "invalid" || connection.status === "failed" || undefined}
                >
                  <summary>{hasApiKey ? "Use a different project" : "Add your API key"}</summary>
                  {keysForm}
                </details>
              )}
            </>
          ) : canUseDeveloperTools ? (
            <>
              <p className="step__text">
                Create a free project at{" "}
                <a href={vouchedLinks.signUp} target="_blank" rel="noopener">
                  kya.vouched.id
                </a>
                , open <strong>Installations</strong> and copy your <strong>Project ID</strong>. That&apos;s all the
                Checkpoint pixel needs. Add an <strong>API key</strong> (it starts with <code>sk_</code>) too, so this
                app&apos;s middleware can report the simulated traffic in step 2.{" "}
                <a href={readmeUrl("get-your-project-id-and-api-key")} target="_blank" rel="noopener">
                  Step-by-step instructions
                </a>
              </p>
              {keysForm}
            </>
          ) : (
            <p className="step__text">
              Add your keys to <code>{envFileName}</code> or your environment variables, then restart the app. The
              README walks through both.
            </p>
          )}

          <p className="step__source">
            <Icon name="code" size={14} />
            <span>
              <a href={sourceUrl("src/checkpoint.ts")} rel="noopener">
                checkpoint.ts
              </a>{" "}
              reads your keys from the environment, and{" "}
              <a href={sourceUrl("src/proxy.ts")} rel="noopener">
                proxy.ts
              </a>{" "}
              runs <code>withCheckpoint()</code> on every request.
            </span>
          </p>
        </section>
      </li>

      <li className={`step step--${steps.simulate}`}>
        <StepMarker state={steps.simulate} number={2} />

        <section className="step__panel" id="simulate" aria-labelledby="simulate-title">
          <header className="step__header">
            <h2 id="simulate-title" className="step__title">
              Send simulated traffic
            </h2>
          </header>

          <p className="step__text" data-testid="simulate-instructions">
            Each visitor below sends one request through the Checkpoint middleware in this app, using the user agent it
            really sends. Checkpoint classifies it like any live request and reports it to your dashboard.
            {hasProjectId && !hasApiKey && " This step requires an API key, so add yours in step 1 first."}
          </p>

          <div className="simulate">
            {!hasProjectId ? (
              <p className="hint">Connect your project in step 1 first, so the traffic has somewhere to go.</p>
            ) : canUseDeveloperTools ? (
              <form action={simulate}>
                <button
                  type="submit"
                  className="btn btn--primary btn--lg"
                  disabled={isSending}
                  aria-busy={isSending || undefined}
                >
                  <Icon name="zap" size={18} />
                  <span className="btn__label">
                    {isSending ? "Sending…" : report ? "Send again" : "Send simulated traffic"}
                  </span>
                </button>
              </form>
            ) : (
              <p className="hint">
                Run this sample on your own machine with <code>npm run dev</code> to send simulated traffic.
              </p>
            )}

            {simulation.status === "unavailable" && (
              <p className="alert alert--warning" role="alert">
                <Icon name="alert" size={18} />
                <span>{simulation.message}</span>
              </p>
            )}

            {report && <DeliveryAlert {...deliveryMessage(report)} />}
          </div>

          {visitorGroups.map(({ kind, heading }) => (
            <div key={kind}>
              <h3 className="visitors__heading">{heading}</h3>
              <ul className={report ? "visitors visitors--sent" : "visitors"}>
                {simulatedVisitors
                  .filter((visitor) => visitor.kind === kind)
                  .map((visitor) => {
                    const visit = report?.visits.find((candidate) => candidate.visitorId === visitor.id);
                    const verdict = visit && verdictBadge(visit);

                    return (
                      <li key={visitor.id} className="visitor" data-testid={`visitor-${visitor.id}`}>
                        <span className={`visitor__icon visitor__icon--${kind === "ai-agent" ? "agent" : "bot"}`}>
                          <Icon name={kind === "ai-agent" ? "sparkles" : "bot"} size={18} />
                        </span>
                        <div className="visitor__body">
                          <p className="visitor__name">
                            {visitor.name} <span className="visitor__operator">{visitor.operator}</span>
                          </p>
                          <p className="visitor__description">{visitor.description}</p>
                          <code className="visitor__token" title={visitor.userAgent}>
                            {visitor.token}
                          </code>
                        </div>
                        <div className="visitor__result">
                          {visit ? (
                            <>
                              <span className={`badge badge--${verdictTone(visit)}`}>{verdictLabel(visit)}</span>
                              {verdict && <span className={`badge badge--${verdict.tone}`}>{verdict.label}</span>}
                              <span className="visitor__detail">{verdictDetail(visit)}</span>
                            </>
                          ) : (
                            <span className="badge badge--muted">Not sent</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}

          <ul className="notes">
            <li>
              Checkpoint recognizes these visitors by the user agent each one declares. That tells it the agent&apos;s
              name, not who really sent the request; agents that sign their requests can be{" "}
              <a href={vouchedLinks.verificationDocs} target="_blank" rel="noopener">
                verified cryptographically
              </a>
              .
            </li>
            <li>
              Try this: change <code>enforcementMode</code> in <code>src/checkpoint.ts</code> from{" "}
              <code>&apos;observe&apos;</code> to <code>&apos;enforce&apos;</code> and send again to see which visitors
              Checkpoint blocks.
            </li>
          </ul>

          <p className="step__source">
            <Icon name="code" size={14} />
            <span>
              <a href={sourceUrl("src/lib/simulation/traffic-simulator.ts")} rel="noopener">
                traffic-simulator.ts
              </a>{" "}
              runs each visit through <code>withCheckpoint()</code> and reads the verdict with <code>onResult</code>.
            </span>
          </p>
        </section>
      </li>

      <li className={`step step--${steps.dashboard}`}>
        <StepMarker state={steps.dashboard} number={3} />

        <section className="step__panel" id="dashboard" aria-labelledby="dashboard-title">
          <header className="step__header">
            <h2 id="dashboard-title" className="step__title">
              Watch it arrive in your dashboard
            </h2>
          </header>

          <p className="step__text">
            {hasProjectId ? (
              <>
                Open <strong>Activity</strong> under <strong>Detect</strong> for project <code>{projectId}</code>.{" "}
                {hasApiKey
                  ? "Every simulated visit shows up there with its class, confidence and agent name, usually within a minute, along with your own visit to this page."
                  : "Your own visit to this page shows up there within a minute, reported by the Checkpoint pixel."}
              </>
            ) : (
              <>
                Open your project&apos;s <strong>Activity</strong> feed under <strong>Detect</strong>. Every simulated
                visit shows up there with its class, confidence and agent name, usually within a minute, along with your
                own visit to this page.
              </>
            )}
          </p>

          <a
            className={`btn ${steps.dashboard === "current" ? "btn--primary" : "btn--ghost"}`}
            href={vouchedLinks.dashboard}
            target="_blank"
            rel="noopener"
          >
            Open your Checkpoint dashboard
            <Icon name="external" size={16} />
          </a>

          {hasProjectId && (
            <ul className="notes">
              <li>
                Not there? Make sure your dashboard is showing the project with this ID; each project&apos;s ID is under{" "}
                <strong>Installations</strong>. Then widen Activity&apos;s time range and clear its filters.
              </li>
            </ul>
          )}
        </section>
      </li>
    </ol>
  );
}

function StepMarker({ state, number }: { state: StepState; number: number }) {
  return (
    <span className="step__marker" aria-hidden="true">
      {state === "complete" ? <Icon name="check" size={16} /> : number}
    </span>
  );
}

function ConnectionPill({
  isSaving,
  hasProjectId,
  hasApiKey,
}: {
  isSaving: boolean;
  hasProjectId: boolean;
  hasApiKey: boolean;
}) {
  const [tone, label] = isSaving
    ? ["info", "Saving"]
    : hasProjectId && hasApiKey
      ? ["success", "Configured"]
      : hasProjectId
        ? ["info", "Pixel only"]
        : ["warning", "Not configured"];

  return (
    <span className={`pill pill--${tone}`} data-testid="connection-status">
      <span className="pill__dot" />
      {label}
    </span>
  );
}

function KeysForm({
  action,
  state,
  isSaving,
  projectId,
  envFileName,
}: {
  action: (formData: FormData) => void;
  state: ConnectProjectState;
  isSaving: boolean;
  projectId?: string;
  envFileName: string;
}) {
  const errors = state.status === "invalid" ? state.errors : {};

  return (
    <form action={action} className="form" noValidate>
      <div className="form__fields">
        <div className="field">
          <label htmlFor="project-id">Project ID</label>
          <input
            id="project-id"
            name="projectId"
            defaultValue={state.status === "invalid" ? state.projectId : projectId}
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste your Project ID"
            className={errors.projectId ? "invalid" : undefined}
            aria-invalid={errors.projectId ? true : undefined}
            aria-describedby={errors.projectId ? "project-id-error" : undefined}
          />
          {errors.projectId && (
            <p id="project-id-error" className="validation-message">
              {errors.projectId}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="api-key">
            API key <span className="field__optional">Optional</span>
          </label>
          <input
            id="api-key"
            name="apiKey"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="sk_…"
            className={errors.apiKey ? "invalid" : undefined}
            aria-invalid={errors.apiKey ? true : undefined}
            aria-describedby={errors.apiKey ? "api-key-error" : undefined}
          />
          {errors.apiKey && (
            <p id="api-key-error" className="validation-message">
              {errors.apiKey}
            </p>
          )}
        </div>
      </div>

      {state.status === "failed" && (
        <p className="alert alert--warning" role="alert">
          <Icon name="alert" size={18} />
          <span>{state.message}</span>
        </p>
      )}

      <div className="form__actions">
        <button type="submit" className="btn btn--primary" disabled={isSaving} aria-busy={isSaving || undefined}>
          <span className="btn__label">{isSaving ? "Saving…" : "Save and connect"}</span>
          <Icon name="arrow-right" size={16} />
        </button>
        <p className="form__note">
          <Icon name="lock" size={14} />
          <span>
            Saved to <code>{envFileName}</code>, which git ignores.
          </span>
        </p>
      </div>
    </form>
  );
}

function DeliveryAlert({ tone, icon, text }: ReturnType<typeof deliveryMessage>) {
  return (
    <p className={`alert alert--${tone}`} role={tone === "warning" ? "alert" : "status"} data-testid="delivery-status">
      <Icon name={icon} size={18} />
      <span>{text}</span>
    </p>
  );
}
