import { year, employees, lastDaysWorkedEmp, lastDaysWorkedPO, vocation, vocationPO, bailiffs } from "./data/data.js"
import { insertEmployees } from "./functions/insertEmployees.js"
import { splitYear } from "./functions/splitYear.js"

const entries = insertEmployees(splitYear(year, '9-1', '17-12'), employees, lastDaysWorkedEmp, vocation)
const entries2 = insertEmployees(splitYear(year, '9-1', '17-12'), bailiffs, lastDaysWorkedPO, vocationPO)

const obj = {}

entries.forEach((el, id) => {
  const month = el[0]
  let weeks = el[1]

  weeks = weeks.map((week, idx) => {
    const set = new Set()
    week.forEach((e, i) => {
      set.add(e)
      set.add(entries2[id][1][idx][i])
    })
    return Array.from(set)
  })

  obj[month] = weeks
})

console.log(obj)

