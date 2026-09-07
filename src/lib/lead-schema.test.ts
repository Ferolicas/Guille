import { describe, expect, it } from "vitest";
import { leadSchema } from "./lead-schema";

const validLead = {
  name: "Ana Pérez",
  phone: "600 000 000",
  email: "ana@example.com",
  city: "Barcelona",
  service: "Reforma integral",
  message: "Quiero reformar la cocina y el baño.",
  consent: true,
  website: "",
  startedAt: Date.now() - 5000,
  source: "web-form",
};

describe("leadSchema", () => {
  it("acepta una solicitud válida", () => {
    expect(leadSchema.safeParse(validLead).success).toBe(true);
  });

  it("rechaza el honeypot y la falta de consentimiento", () => {
    expect(leadSchema.safeParse({ ...validLead, website: "spam.example" }).success).toBe(false);
    expect(leadSchema.safeParse({ ...validLead, consent: false }).success).toBe(false);
  });

  it("convierte los campos opcionales vacíos en null", () => {
    const result = leadSchema.parse({ ...validLead, email: "", city: "" });
    expect(result.email).toBeNull();
    expect(result.city).toBeNull();
  });
});
