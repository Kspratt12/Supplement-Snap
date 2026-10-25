import { describe, it, expect } from "vitest"
import {
  CLAIM_STATUSES,
  normalizeClaimStatus,
  countByStatus,
  filterProjects,
  statusAfterSend,
  isDemoProject,
  isFirstRun,
} from "../lib/claim-status"

const projects = [
  { project_name: "Smith Residence", property_address: "12 Oak Lane, Cary NC", claim_number: "SF-1001", insurance_company: "State Farm", claim_status: "In Progress" },
  { project_name: "Garcia Roof", property_address: "9 Pine Ct, Apex NC", claim_number: "AL-2002", insurance_company: "Allstate", adjuster_name: "Dana Lee", claim_status: "Sent to Adjuster" },
  { project_name: "Nguyen Duplex", property_address: "500 Maple Ave, Raleigh NC", claim_number: "SF-3003", insurance_company: "State Farm", claim_status: "approved" },
  { project_name: "Brown Garage", property_address: "77 Elm St", claim_status: null },
  { project_name: "Old Job", property_address: "1 Main St", claim_status: "Something Legacy" },
]

describe("normalizeClaimStatus", () => {
  it("accepts every known status exactly", () => {
    for (const s of CLAIM_STATUSES) expect(normalizeClaimStatus(s)).toBe(s)
  })
  it("ignores case and surrounding spaces", () => {
    expect(normalizeClaimStatus("  approved ")).toBe("Approved")
    expect(normalizeClaimStatus("PARTIALLY APPROVED")).toBe("Partially Approved")
  })
  it("treats empty, null, undefined and unknown values as In Progress", () => {
    expect(normalizeClaimStatus("")).toBe("In Progress")
    expect(normalizeClaimStatus(null)).toBe("In Progress")
    expect(normalizeClaimStatus(undefined)).toBe("In Progress")
    expect(normalizeClaimStatus("Something Legacy")).toBe("In Progress")
  })
})

describe("countByStatus", () => {
  it("counts every project once and includes zero counts", () => {
    const c = countByStatus(projects)
    expect(c["In Progress"]).toBe(3) // one explicit, one null, one legacy value
    expect(c["Sent to Adjuster"]).toBe(1)
    expect(c["Approved"]).toBe(1)
    expect(c["Denied"]).toBe(0)
    expect(Object.values(c).reduce((a, b) => a + b, 0)).toBe(projects.length)
  })
})

describe("filterProjects", () => {
  it("returns everything for an empty query and All", () => {
    expect(filterProjects(projects, "", "All")).toHaveLength(5)
  })
  it("searches name, address, claim number, carrier and adjuster, ignoring case", () => {
    expect(filterProjects(projects, "garcia", "All").map((p) => p.project_name)).toEqual(["Garcia Roof"])
    expect(filterProjects(projects, "raleigh", "All").map((p) => p.project_name)).toEqual(["Nguyen Duplex"])
    expect(filterProjects(projects, "sf-1001", "All").map((p) => p.project_name)).toEqual(["Smith Residence"])
    expect(filterProjects(projects, "state farm", "All")).toHaveLength(2)
    expect(filterProjects(projects, "dana", "All").map((p) => p.project_name)).toEqual(["Garcia Roof"])
  })
  it("requires every word to match, in any order", () => {
    expect(filterProjects(projects, "apex garcia", "All")).toHaveLength(1)
    expect(filterProjects(projects, "apex smith", "All")).toHaveLength(0)
  })
  it("combines the text search with a status filter", () => {
    expect(filterProjects(projects, "state farm", "Approved").map((p) => p.project_name)).toEqual(["Nguyen Duplex"])
    expect(filterProjects(projects, "", "Denied")).toHaveLength(0)
    expect(filterProjects(projects, "", "In Progress")).toHaveLength(3)
  })
  it("does not crash on projects with missing optional fields", () => {
    expect(() => filterProjects([{ project_name: "Bare" }], "x", "All")).not.toThrow()
  })
})

describe("statusAfterSend", () => {
  it("moves an in-progress job to Sent to Adjuster", () => {
    expect(statusAfterSend("In Progress")).toBe("Sent to Adjuster")
    expect(statusAfterSend(null)).toBe("Sent to Adjuster")
    expect(statusAfterSend(undefined)).toBe("Sent to Adjuster")
  })
  it("never moves a later stage backwards", () => {
    for (const s of CLAIM_STATUSES.filter((x) => x !== "In Progress")) expect(statusAfterSend(s)).toBe(s)
  })
})

describe("first-run detection", () => {
  it("recognises the demo project", () => {
    expect(isDemoProject({ project_name: "Demo Project — Smith Residence" })).toBe(true)
    expect(isDemoProject({ project_name: "Smith Residence" })).toBe(false)
  })
  it("is first run when there are no projects or only the demo", () => {
    expect(isFirstRun([])).toBe(true)
    expect(isFirstRun([{ project_name: "Demo Project — Smith Residence" }])).toBe(true)
  })
  it("is not first run once a real project exists", () => {
    expect(isFirstRun([{ project_name: "Demo Project — Smith Residence" }, { project_name: "Garcia Roof" }])).toBe(false)
  })
})
