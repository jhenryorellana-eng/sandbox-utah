import { describe, expect, it } from "vitest"
import {
  FORM_REGISTRY,
  getFormBySlug,
  listFormsForCase,
} from "@/server/legal/utah-courts/forms/registry"

describe("forms registry", () => {
  it("FORM_REGISTRY tiene al menos el demo de custodia", () => {
    expect(FORM_REGISTRY.length).toBeGreaterThan(0)
    expect(FORM_REGISTRY.some((f) => f.slug === "utah-custody-demo-petition")).toBe(true)
  })

  it("cada form tiene los metadatos requeridos", () => {
    for (const form of FORM_REGISTRY) {
      expect(form.slug).toMatch(/^[a-z0-9-]+$/)
      expect(form.name_es).toBeTruthy()
      expect(form.name_en).toBeTruthy()
      expect(form.serviceSlugs.length).toBeGreaterThan(0)
      expect(typeof form.schema.parse).toBe("function")
      expect(typeof form.prefill).toBe("function")
      expect(form.fieldGroups.length).toBeGreaterThan(0)
      expect(form.version).toBeTruthy()
    }
  })

  it("getFormBySlug retorna el form correcto", () => {
    const found = getFormBySlug("utah-custody-demo-petition")
    expect(found).not.toBeNull()
    expect(found?.serviceSlugs).toContain("child-custody")
  })

  it("getFormBySlug retorna null para slugs desconocidos", () => {
    expect(getFormBySlug("desconocido")).toBeNull()
  })

  it("listFormsForCase filtra por serviceSlug", () => {
    const custodyForms = listFormsForCase("child-custody", null)
    expect(custodyForms.length).toBeGreaterThan(0)
    expect(custodyForms.every((f) => f.serviceSlugs.includes("child-custody"))).toBe(true)

    const divorceForms = listFormsForCase("uncontested-divorce", null)
    expect(divorceForms.length).toBe(0)
  })

  it("listFormsForCase filtra por districtId si el form no es 'all'", () => {
    // Todos los forms actuales son 'all', así que pasar districtId=3 debería incluirlos
    const formsForDistrict3 = listFormsForCase("child-custody", 3)
    expect(formsForDistrict3.length).toBeGreaterThan(0)
  })

  it("cada form_groups referencia campos definidos en fieldLabels", () => {
    for (const form of FORM_REGISTRY) {
      for (const group of form.fieldGroups) {
        for (const fieldName of group.fields) {
          expect(form.fieldLabels[fieldName as never]).toBeDefined()
        }
      }
    }
  })
})
