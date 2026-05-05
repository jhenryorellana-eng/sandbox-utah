import { describe, expect, it } from "vitest"
import { signInSchema, signUpSchema } from "@/features/auth/schemas"

describe("signInSchema", () => {
  it("acepta email + password >= 8", () => {
    const result = signInSchema.safeParse({ email: "user@ex.com", password: "secret123" })
    expect(result.success).toBe(true)
  })

  it("rechaza password corto", () => {
    const result = signInSchema.safeParse({ email: "user@ex.com", password: "abc" })
    expect(result.success).toBe(false)
  })

  it("rechaza email malformado", () => {
    const result = signInSchema.safeParse({ email: "noemail", password: "secret123" })
    expect(result.success).toBe(false)
  })
})

describe("signUpSchema", () => {
  it("acepta password con mayúscula, minúscula y número", () => {
    const result = signUpSchema.safeParse({
      email: "user@ex.com",
      password: "Passw0rd!",
      fullName: "John Doe",
      preferredLanguage: "es",
    })
    expect(result.success).toBe(true)
  })

  it("rechaza password sin mayúscula", () => {
    const result = signUpSchema.safeParse({
      email: "user@ex.com",
      password: "passw0rd!",
      fullName: "John Doe",
    })
    expect(result.success).toBe(false)
  })

  it("rechaza password sin número", () => {
    const result = signUpSchema.safeParse({
      email: "user@ex.com",
      password: "Password!",
      fullName: "John Doe",
    })
    expect(result.success).toBe(false)
  })

  it("default preferredLanguage es es", () => {
    const result = signUpSchema.parse({
      email: "user@ex.com",
      password: "Passw0rd!",
      fullName: "John Doe",
    })
    expect(result.preferredLanguage).toBe("es")
  })

  it("rechaza locale fuera de es/en", () => {
    const result = signUpSchema.safeParse({
      email: "user@ex.com",
      password: "Passw0rd!",
      fullName: "John Doe",
      preferredLanguage: "fr",
    })
    expect(result.success).toBe(false)
  })
})
