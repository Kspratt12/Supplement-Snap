import { configure } from "@testing-library/react"

// findBy/waitFor default to 1 s, which is too tight when the machine is busy (a build or another run alongside).
// A passing test still returns as soon as its condition is true, so a longer ceiling only matters when it would otherwise fail.
configure({ asyncUtilTimeout: 15000 })
