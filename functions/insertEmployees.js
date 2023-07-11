import { year, employees, bailiffs } from "../data/data.js"
import { months, month as mnth } from "../helpers/helpers.js";

let employee = 0, count = 0, crash = false, beforeEmployees = []

function update(employees) {
  if (employee === employees.length - 1) 
    employee = 0
  else employee++
}

function oldestShift(entries, employees) {
  let len = entries.length
  if (len) {
    let minEmp
    let min = 99999
    while( len-- ) {
      if ( entries[len][1] < min ) {
        min = entries[len][1]
        minEmp = entries[len][0]
      }
    }
    employee = employees.indexOf(minEmp)
    return minEmp
  }
}

function isOn(startMonth, endMonth, startDay, endDay, month, week, employees, vocations, lastDaysWorkedEntries = null) {
  const week0 = week[0]
  const week1 = week[1] || week0

  let start = startDay
  let end

  if ( startMonth === month && endMonth === month ) {     
    end = endDay
  }
  else if ( startMonth === month ) {
    end = new Date(year, months[month], 0).getDate()
  }
  else if ( endMonth === month ) {
    start = 1
    end = endDay
  } 
  else if ( mnth[parseInt(months[startMonth]) + 1] === month && mnth[months[endMonth] - 1] === month ) {
    start = 1
    end = new Date(year, months[month], 0).getDate()
  } 
  else {
    return
  }

  if (         
    (start >= week0 && start <= week1) ||
    (end >= week0 && start <= week0)   
  ) {
    beforeEmployees.push(employee)

    if ( lastDaysWorkedEntries && lastDaysWorkedEntries.length ) {
      let minEmp = oldestShift(lastDaysWorkedEntries, employees)
      let lastDaysWorkedEntries2 = lastDaysWorkedEntries.filter(e => e[0] !== minEmp)
      oldestShift(lastDaysWorkedEntries2, employees)

      if (!beforeEmployees.includes(employee)) 
        isOnVocation(month, week, vocations, employees, lastDaysWorkedEntries2)
      else 
        crash = true

    } else {
      update(employees)
      if (!beforeEmployees.includes(employee)) 
        isOnVocation(month, week, vocations, employees)
      else 
        crash = true
    }

    beforeEmployees = []
  }
}

const bail = new Set()
const empl = new Set()

bailiffs.forEach(b => bail.add(b))
employees.forEach(e => empl.add(e))

function getStartDay(startMonth, employeeName, vocation) {
  let subDays = 0

  if (bail.has(employeeName)) 
    subDays = 10
  else if (empl.has(employeeName))
    subDays = 1

  let newStartDay = vocation.startDay - subDays

  if (newStartDay <= 0) {
    let newStartMonth = months[startMonth] - 1
    let yearStartVocation = year

    if (newStartMonth <= 0) {
      newStartMonth = 12
      yearStartVocation = year - 1
    } 
    const lastDayMonth = new Date(yearStartVocation, newStartMonth, 0).getDate()
    newStartDay = lastDayMonth + newStartDay

    return { startMonth: mnth[newStartMonth], startDay: newStartDay }
  }
  return { startMonth, startDay: newStartDay }
}

function isOnVocation(month, week, vocations, employees, lastDaysWorkedEntries = null) {
  const beforeEmp = employees[employee] 
  const employeeVocation = vocations[employees[employee]]
  let len = employeeVocation?.length || null
  
  if ( len ) {
    for (let i = 0; i < len; i++) {
      if (!week) continue
      const vocation = employeeVocation[i]     
      const start = getStartDay(vocation.startMonth, employees[employee], vocation)
      const { startMonth } = start
      const { startDay } = start
      const endMonth = vocation.endMonth
      const endDay = vocation.endDay 

      isOn(startMonth, endMonth, startDay, endDay, month, week, employees, vocations, lastDaysWorkedEntries)

      if (employees[employee] !== beforeEmp) break
    }
  }
}

let repeated

async function addEmployeeOnDutyWeek(month, week, nextWeek, employees, vocations, lastDaysWorked, lastDaysWorkedEntries = null) {
  let weekNumberDays
  let week1 = week[1] || week[0]
  if (week.length === 2)
    weekNumberDays = (week1 - week[0]) + 1
  else 
    weekNumberDays = 1

  if ( weekNumberDays === 7 ) {
    isOnVocation(month, week, vocations, employees, lastDaysWorkedEntries)
    if (crash) {
      week.push('-----')
      crash = false
    } else {
      week.push(employees[employee])
      lastDaysWorked[employees[employee]] = parseInt(months[month] + '' + (week1 < 10 ? `0${week1}` : week1))
    }
    update(employees)
  } 
  else if ( count === 1 ) {
    count = 0
    week.push(repeated)
    update(employees)
    if (crash) crash = false
    else lastDaysWorked[repeated] = parseInt(months[month] + '' + (week1 < 10 ? `0${week1}` : week1))
  } 
  else {
    isOnVocation(month, week, vocations, employees, lastDaysWorkedEntries)
    isOnVocation(month, nextWeek, vocations, employees, lastDaysWorkedEntries)
    if (crash) repeated = '-----'
    else repeated = employees[employee]
    week.push(repeated)
    count++
  }
}

export function insertEmployees(yearSplited, employees, lastDaysWorked, vocations) {
  const entries = Object.entries(yearSplited)
  let fullcicle = false

  for( let i = 0; i < entries.length; i++ ) {
    const month = entries[i][0].toLowerCase()
    let weeks = entries[i][1]

    for( let j = 0; j < weeks.length; j++ ) {
      if ( fullcicle ) {
        let entries = Object.entries(lastDaysWorked)
        oldestShift(entries, employees)
        addEmployeeOnDutyWeek(month, weeks[j], weeks[j+1], employees, vocations, lastDaysWorked, entries)
      } 
      else {
        addEmployeeOnDutyWeek(month, weeks[j], weeks[j+1], employees, vocations, lastDaysWorked)
        fullcicle = Object.values(lastDaysWorked).every(e => e > 0)
      }
    }
  }

  employee = 0
  count = 0

  return entries
}

