export function processDaily(elementList, schedule)
{
    var setValue = schedule[new Date().getHours()] ? 1 : 0;

    elementList.forEach(element => {
        cip.dset(elementList[element], setValue);
    });
}

export function processWeekly(elementList,schedule)
{
    var dayWeekNumber = (new Date().getDay() + 6) % 7;
    processDaily(elementList, schedule[dayWeekNumber]);
}