import { year, employees, bailiffs } from "../data/data.js"
import { months, month as mnth } from "../helpers/helpers.js";

let employee = 0, count = 0

function update() {
  if (employee === employees.length - 1) 
    employee = 0
  else employee++
}

function oldestShift(entries, employees) {
  let len = entries.length
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
    if ( lastDaysWorkedEntries ) {
      let minEmp = oldestShift(lastDaysWorkedEntries, employees)
      let lastDaysWorkedEntries2 = lastDaysWorkedEntries.filter(e => e[0] !== minEmp)
      oldestShift(lastDaysWorkedEntries2, employees)

      isOnVocation(month, week, vocations, employees, lastDaysWorkedEntries2)

    } else {
      update()
      isOnVocation(month, week, vocations, employees)
    }
  }
}

const bail = {}
const empl = {}

let len = bailiffs.length

while(len) {
  bail[bailiffs[len]] = len
  len--
}
len = employees.length

while(len) {
  empl[employees[len]] = len
  len--
}

function getStartDay(startMonth, employeeName, vocation) {
  let subDays = 0

  if (bail[employeeName]) 
    subDays = 10
  else if (empl[employeeName])
    subDays = 1

  let newStartDay = vocation.startDay - subDays

  if (newStartDay <= 0) {
    let newStartMonth = months[startMonth] - 1
    newStartDay = new Date(year, newStartMonth, 0).getDate() + newStartDay

    return { startMonth: mnth[newStartMonth], startDay: newStartDay }
  }
  return { startMonth, startDay: newStartDay }
}

function isOnVocation(month, week, vocations, employees, lastDaysWorkedEntries = null) {
  let employeeVocation = vocations[employees[employee]]
  let len = employeeVocation?.length || null
  
  if ( len ) {
    for (let i = 0; i < len; i++) {
      if (!week) continue
      const vocation = employeeVocation[i]     
      let startDay = getStartDay(vocation.startMonth, employees[employee], vocation)
      const startMonth = startDay.startMonth
      startDay = startDay.startDay
      const endMonth = vocation.endMonth
      const endDay = vocation.endDay 

      isOn(startMonth, endMonth, startDay, endDay, month, week, employees, vocations, lastDaysWorkedEntries)

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
    week.push(employees[employee])
    lastDaysWorked[employees[employee]] = parseInt(months[month] + '' + (week1 < 10 ? `0${week1}` : week1))

    update()
  } 
  else if ( count === 1 ) {
    count = 0
    week.push(repeated)
    lastDaysWorked[repeated] = parseInt(months[month] + '' + (week1 < 10 ? `0${week1}` : week1))

    update()
  } 
  else {
    isOnVocation(month, week, vocations, employees, lastDaysWorkedEntries)
    isOnVocation(month, nextWeek, vocations, employees, lastDaysWorkedEntries)
    repeated = employees[employee]
    week.push(employees[employee])
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

