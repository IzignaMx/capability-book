import { describe, expect, it } from "vitest";
import { parseLeadContext } from "../src/features/diagnostic/LeadContext";

describe("parseLeadContext", () => {
  it("preserves safe project, service, and campaign context without personal data", () => {
    const context = parseLeadContext(
      new URL(
        "https://book.izignamx.com/es/diagnostico/?project=omnisync&service=commerce&utm_source=portfolio&email=private%40example.com"
      ),
      "es"
    );

    expect(context).toEqual({
      sourceRoute: "/es/diagnostico/",
      sourceProject: "omnisync",
      selectedServices: ["commerce"],
      locale: "es",
      campaign: { utm_source: "portfolio" }
    });
    expect(JSON.stringify(context)).not.toContain("private@example.com");
  });

  it("drops malformed slugs and unsafe campaign values", () => {
    const context = parseLeadContext(
      new URL(
        "https://book.izignamx.com/en/diagnostic/?project=../secret&capability=Web%20GL&concept=valid-concept&utm_source=%3Cscript%3E&utm_medium=case.study"
      ),
      "en"
    );

    expect(context).toEqual({
      sourceRoute: "/en/diagnostic/",
      sourceConcept: "valid-concept",
      selectedServices: [],
      locale: "en",
      campaign: { utm_medium: "case.study" }
    });
  });

  it("keeps capability context and ignores non-campaign query parameters", () => {
    const context = parseLeadContext(
      new URL(
        "https://book.izignamx.com/es/diagnostico/?capability=immersive-web&name=Edgar&utm_campaign=case-study"
      ),
      "es"
    );

    expect(context).toEqual({
      sourceRoute: "/es/diagnostico/",
      sourceCapability: "immersive-web",
      selectedServices: [],
      locale: "es",
      campaign: { utm_campaign: "case-study" }
    });
  });
});
