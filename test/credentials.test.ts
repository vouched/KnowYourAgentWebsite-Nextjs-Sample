import { describe, expect, it } from "vitest";

import { apiKeyHint, parseCredentials, readCredentials } from "@/lib/credentials";

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }

  return formData;
}

describe("Credentials", () => {
  it("are read from the environment", () => {
    expect(readCredentials({ CHECKPOINT_PROJECT_ID: " acme-storefront ", CHECKPOINT_API_KEY: "sk_test" })).toEqual({
      projectId: "acme-storefront",
      apiKey: "sk_test",
    });
  });

  it("treat blank values as missing", () => {
    expect(readCredentials({ CHECKPOINT_PROJECT_ID: "", CHECKPOINT_API_KEY: "  " })).toEqual({});
  });

  it.each([
    ["sk_0123456789abcdef", "••••cdef"],
    ["sk_short", "••••"],
    [undefined, undefined],
  ])("never show the API key %s in full", (apiKey, hint) => {
    expect(apiKeyHint(apiKey)).toBe(hint);
  });

  describe("form", () => {
    it("only needs a Project ID", () => {
      expect(parseCredentials(form({ projectId: " acme-storefront ", apiKey: "" }))).toEqual({
        ok: true,
        projectId: "acme-storefront",
        apiKey: undefined,
      });
    });

    it("accepts an API key too", () => {
      expect(
        parseCredentials(form({ projectId: "3f2b8c1e-7d4a-4e9b-9c2f-1a6d5e8b7c40", apiKey: "sk_abc123" })),
      ).toEqual({
        ok: true,
        projectId: "3f2b8c1e-7d4a-4e9b-9c2f-1a6d5e8b7c40",
        apiKey: "sk_abc123",
      });
    });

    it.each([
      ["", "Paste the Project ID from your Vouched dashboard."],
      ["acme storefront", "A Project ID only contains letters, numbers, dashes and underscores."],
      ["x".repeat(129), "A Project ID is at most 128 characters."],
    ])("rejects the Project ID %j", (projectId, error) => {
      expect(parseCredentials(form({ projectId }))).toEqual({ ok: false, errors: { projectId: error } });
    });

    // .env.local stores the key unquoted, where these characters would change or cut off its value
    it.each(["sk_has space", 'sk_"quoted"', "sk_hash#comment"])("rejects the API key %j", (apiKey) => {
      expect(parseCredentials(form({ projectId: "acme-storefront", apiKey }))).toEqual({
        ok: false,
        errors: { apiKey: "An API key only contains letters, numbers, dashes and underscores." },
      });
    });
  });
});
