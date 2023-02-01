import { month } from "../helpers/helpers.js"

export function splitYear(year, startDate = '', endDate = '') {
  let daysOfTheMonth, rest = 0 
  const weeksOnDuty = {}

  const startMonth = parseInt(startDate.split('-')[1])
  let startDay = parseInt(startDate.split('-')[0])

  const endMonth = parseInt(endDate.split('-')[1])
  let endDay = parseInt(endDate.split('-')[0])

  for ( let i = startMonth; i <= endMonth; i++ ) {
    daysOfTheMonth = new Date(year, i, 0).getDate()
    let key = month[i].toUpperCase()
    let startWeek = 1

    if ( rest ) {
      rest = 7 - rest
      startWeek = rest + 1

      let week = new Array(2)

      if ( rest === 1 ) 
        week = [1]
      else {
        week[0] = 1
        week[1] = rest
      }

      weeksOnDuty[key] 
        ? weeksOnDuty[key].push(week) 
        : weeksOnDuty[key] = [week]
    }

    let firstWeek = startWeek - 1

    daysOfTheMonth = daysOfTheMonth - firstWeek

    if ( startDay ) {
      daysOfTheMonth = daysOfTheMonth - (startDay - 1)
      startWeek = startDay
      firstWeek = startWeek - 1
      startDay = null
    }

    rest = daysOfTheMonth % 7

    if ( rest ) 
      daysOfTheMonth = daysOfTheMonth - rest

    let weeksOfTheMonth = daysOfTheMonth / 7

    if ( !weeksOnDuty[key] ) {
      weeksOnDuty[key] = [[startWeek, startWeek+6]]
      startWeek += 7
      weeksOfTheMonth--
    }

    while ( weeksOfTheMonth-- ) {
      weeksOnDuty[key].push([startWeek, startWeek+6])
      startWeek += 7
    }

    if ( rest ) {
      daysOfTheMonth = daysOfTheMonth + firstWeek
      let arr = new Array(2)
      if ( rest === 1)
        arr = [daysOfTheMonth + 1]
      else {
        arr[0] = daysOfTheMonth + 1
        arr[1] = daysOfTheMonth + rest
      }
      weeksOnDuty[key].push(arr) 
    }

    if ( i === endMonth ) {
      function test() {
        const lastValue = weeksOnDuty[key].length - 1
    
        const startDayWeek = weeksOnDuty[key][lastValue][0] 
        let endDayWeek = weeksOnDuty[key][lastValue][1] 

        if ( startDayWeek > endDay ) {
          weeksOnDuty[key].pop()
          test()
        } 
        else if ( endDayWeek > endDay ) {
          while( endDayWeek > endDay ) {
            endDayWeek--
            weeksOnDuty[key][lastValue][1] = endDayWeek
          }
        }
      }
      test()
    }
  }
  return weeksOnDuty
}
